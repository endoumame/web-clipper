import type { PasswordHasher, User, UserRepository } from "../../domain/user/index.js";
import type { Session, SessionRepository } from "../../domain/session/index.js";
import { SessionEntity, SessionIdVO } from "../../domain/session/index.js";
import { err, ok } from "neverthrow";
import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";

interface LoginDeps {
  readonly userRepo: UserRepository;
  readonly sessionRepo: SessionRepository;
  readonly passwordHasher: PasswordHasher;
}

interface LoginInput {
  readonly username: string;
  readonly password: string;
}

interface LoginResult {
  readonly user: User;
  readonly session: Session;
}

const login = (deps: LoginDeps): ((input: LoginInput) => ResultAsync<LoginResult, DomainError>) => {
  const executeLogin = (input: LoginInput): ResultAsync<LoginResult, DomainError> =>
    deps.userRepo
      .findByUsername(input.username)
      .andThen((user) => {
        if (user) {
          return ok(user);
        }
        return err({
          message: "Invalid username or password",
          type: "INVALID_CREDENTIALS" as const,
        });
      })
      .andThen((user) =>
        deps.passwordHasher
          .verify(input.password, user.passwordHash, user.passwordSalt)
          .andThen((valid) => {
            if (valid) {
              return ok(user);
            }
            return err({
              message: "Invalid username or password",
              type: "INVALID_CREDENTIALS" as const,
            });
          }),
      )
      .andThen((user) =>
        deps.sessionRepo.deleteExpired().andThen(() => {
          const session = SessionEntity.create({
            id: SessionIdVO.generate(),
            userId: user.id,
          });
          return deps.sessionRepo
            .save(session)
            .map((savedSession) => ({ session: savedSession, user }));
        }),
      );
  return executeLogin;
};

export { login };
