import type { Session, SessionRepository } from "../../domain/session/index.js";
import { SessionEntity, SessionIdVO } from "../../domain/session/index.js";
import type { User, UserRepository } from "../../domain/user/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";
import { UserEntity } from "../../domain/user/index.js";
import { err } from "neverthrow";

interface GitHubOAuthCallbackDeps {
  readonly userRepo: UserRepository;
  readonly sessionRepo: SessionRepository;
}

interface GitHubOAuthCallbackInput {
  readonly githubId: string;
  readonly githubUsername: string;
}

interface GitHubOAuthCallbackResult {
  readonly user: User;
  readonly session: Session;
}

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
        return deps.sessionRepo.save(session).map((sv) => ({ session: sv, user: existingUser }));
      }

      // GitHub ID not linked yet — find the single user in single-user mode
      return deps.userRepo.findFirst().andThen((user) => {
        if (!user) {
          return err<GitHubOAuthCallbackResult, DomainError>({
            message: "No user account exists. Please set up your account first.",
            type: "OAUTH_ERROR",
          });
        }

        if (user.githubId !== null) {
          return err<GitHubOAuthCallbackResult, DomainError>({
            message: "Account is already linked to a different GitHub account.",
            type: "OAUTH_ERROR",
          });
        }

        // Auto-link GitHub account and create session
        const linkedUser = UserEntity.linkGitHub(user, input.githubId);
        return deps.userRepo.save(linkedUser).andThen((savedUser) => {
          const session = SessionEntity.create({
            id: SessionIdVO.generate(),
            userId: savedUser.id,
          });
          return deps.sessionRepo.save(session).map((sv) => ({ session: sv, user: savedUser }));
        });
      });
    });
