import type { PasswordHasher, User, UserRepository } from "../../domain/user/index.js";
import type { Session, SessionRepository } from "../../domain/session/index.js";
import { SessionEntity, SessionIdVO } from "../../domain/session/index.js";
import { UserEntity, UserIdVO } from "../../domain/user/index.js";
import { err, ok } from "neverthrow";
import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";

const EMPTY_COUNT = 0;

interface SetupUserDeps {
  readonly userRepo: UserRepository;
  readonly sessionRepo: SessionRepository;
  readonly passwordHasher: PasswordHasher;
}

interface SetupUserInput {
  readonly username: string;
  readonly password: string;
}

interface SetupUserResult {
  readonly user: User;
  readonly session: Session;
}

const setupUser = (
  deps: SetupUserDeps,
): ((input: SetupUserInput) => ResultAsync<SetupUserResult, DomainError>) => {
  const executeSetupUser = (input: SetupUserInput): ResultAsync<SetupUserResult, DomainError> =>
    deps.userRepo
      .count()
      .andThen((userCount) => {
        if (userCount > EMPTY_COUNT) {
          return err({
            message: "Setup already completed",
            type: "SETUP_ALREADY_COMPLETED" as const,
          });
        }
        return ok();
      })
      .andThen(() => deps.passwordHasher.hash(input.password))
      .andThen(({ hash, salt }) => {
        const user = UserEntity.create({
          id: UserIdVO.generate(),
          passwordHash: hash,
          passwordSalt: salt,
          username: input.username,
        });
        return deps.userRepo.save(user);
      })
      .andThen((user) => {
        const session = SessionEntity.create({
          id: SessionIdVO.generate(),
          userId: user.id,
        });
        return deps.sessionRepo
          .save(session)
          .map((savedSession) => ({ session: savedSession, user }));
      });
  return executeSetupUser;
};

export { setupUser };
