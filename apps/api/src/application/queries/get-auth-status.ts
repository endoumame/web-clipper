import { SessionEntity, SessionIdVO } from "../../domain/session/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";
import type { SessionRepository } from "../../domain/session/index.js";
import type { UserRepository } from "../../domain/user/index.js";
import { ok } from "neverthrow";

const EMPTY_COUNT = 0;

interface GetAuthStatusDeps {
  readonly userRepo: UserRepository;
  readonly sessionRepo: SessionRepository;
}

interface AuthStatusResult {
  readonly authenticated: boolean;
  readonly user: {
    readonly id: string;
    readonly username: string;
    readonly githubLinked: boolean;
  } | null;
  readonly needsSetup: boolean;
}

const unauthenticated = (deps: GetAuthStatusDeps): ResultAsync<AuthStatusResult, DomainError> =>
  deps.userRepo.count().map((userCount) => ({
    authenticated: false,
    needsSetup: userCount === EMPTY_COUNT,
    user: null,
  }));

const hasValue = (sessionId?: string | null): sessionId is string =>
  typeof sessionId === "string" && sessionId !== "";

const getAuthStatus = (
  deps: GetAuthStatusDeps,
): ((sessionId?: string) => ResultAsync<AuthStatusResult, DomainError>) => {
  const executeGetAuthStatus = (sessionId?: string): ResultAsync<AuthStatusResult, DomainError> => {
    if (!hasValue(sessionId)) {
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
          needsSetup: false,
          user: {
            githubLinked: user.githubId !== null,
            id: user.id as string,
            username: user.username,
          },
        });
      });
    });
  };
  return executeGetAuthStatus;
};

export { getAuthStatus };
