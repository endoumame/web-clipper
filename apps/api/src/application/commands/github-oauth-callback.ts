import { err, type ResultAsync } from "neverthrow";
import type { UserRepository, SessionRepository } from "../../domain/ports/mod.js";
import { SessionIdVO } from "../../domain/values/mod.js";
import { SessionEntity, UserEntity, type User, type Session } from "../../domain/entities/mod.js";
import type { DomainError } from "../../domain/errors.js";

type GitHubOAuthCallbackDeps = {
  readonly userRepo: UserRepository;
  readonly sessionRepo: SessionRepository;
};

type GitHubOAuthCallbackInput = {
  readonly githubId: string;
  readonly githubUsername: string;
};

type GitHubOAuthCallbackResult = {
  readonly user: User;
  readonly session: Session;
};

/**
 * GitHub OAuth callback command.
 *
 * Single-user mode logic:
 * 1. If a user with this githubId exists -> create session (login)
 * 2. If no user has this githubId, find the single user:
 *    a. If no users exist -> error (setup required)
 *    b. If user has no githubId linked -> auto-link and create session
 *    c. If user already has a different githubId -> error (already linked)
 */
export const githubOAuthCallback =
  (deps: GitHubOAuthCallbackDeps) =>
  (input: GitHubOAuthCallbackInput): ResultAsync<GitHubOAuthCallbackResult, DomainError> =>
    deps.userRepo.findByGithubId(input.githubId).andThen((existingUser) => {
      if (existingUser) {
        const session = SessionEntity.create({
          id: SessionIdVO.generate(),
          userId: existingUser.id,
        });
        return deps.sessionRepo.save(session).map((s) => ({ user: existingUser, session: s }));
      }

      // GitHub ID not linked yet — find the single user in single-user mode
      return deps.userRepo.findFirst().andThen((user) => {
        if (!user) {
          return err<GitHubOAuthCallbackResult, DomainError>({
            type: "OAUTH_ERROR",
            message: "No user account exists. Please set up your account first.",
          });
        }

        if (user.githubId !== null) {
          return err<GitHubOAuthCallbackResult, DomainError>({
            type: "OAUTH_ERROR",
            message: "Account is already linked to a different GitHub account.",
          });
        }

        // Auto-link GitHub account and create session
        const linkedUser = UserEntity.linkGitHub(user, input.githubId);
        return deps.userRepo.save(linkedUser).andThen((savedUser) => {
          const session = SessionEntity.create({
            id: SessionIdVO.generate(),
            userId: savedUser.id,
          });
          return deps.sessionRepo.save(session).map((s) => ({ user: savedUser, session: s }));
        });
      });
    });
