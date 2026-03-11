import { ok, type ResultAsync } from "neverthrow";
import type { UserRepository, SessionRepository } from "../../domain/ports/mod.js";
import { SessionIdVO } from "../../domain/values/mod.js";
import { SessionEntity } from "../../domain/entities/mod.js";
import type { DomainError } from "../../domain/errors.js";

type GetAuthStatusDeps = {
  readonly userRepo: UserRepository;
  readonly sessionRepo: SessionRepository;
};

type AuthStatusResult = {
  readonly authenticated: boolean;
  readonly user: { readonly id: string; readonly username: string; readonly githubLinked: boolean } | null;
  readonly needsSetup: boolean;
};

const unauthenticated = (deps: GetAuthStatusDeps): ResultAsync<AuthStatusResult, DomainError> =>
  deps.userRepo.count().map((count) => ({
    authenticated: false,
    user: null,
    needsSetup: count === 0,
  }));

export const getAuthStatus =
  (deps: GetAuthStatusDeps) =>
  (sessionId: string | undefined): ResultAsync<AuthStatusResult, DomainError> => {
    if (!sessionId) {
      return unauthenticated(deps);
    }

    const parsed = SessionIdVO.create(sessionId);
    if (parsed.isErr()) {
      return unauthenticated(deps);
    }

    return deps.sessionRepo.findById(parsed.value).andThen((session) => {
      if (!session || SessionEntity.isExpired(session)) {
        return unauthenticated(deps);
      }
      return deps.userRepo.findById(session.userId).andThen((user) => {
        if (!user) {
          return unauthenticated(deps);
        }
        return ok<AuthStatusResult, DomainError>({
          authenticated: true,
          user: {
            id: user.id as string,
            username: user.username,
            githubLinked: user.githubId !== null,
          },
          needsSetup: false,
        });
      });
    });
  };
