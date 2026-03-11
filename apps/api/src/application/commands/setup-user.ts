import { ok, err, type ResultAsync } from "neverthrow";
import type { UserRepository, SessionRepository, PasswordHasher } from "../../domain/ports/mod.js";
import { UserEntity, type User, SessionEntity, type Session } from "../../domain/entities/mod.js";
import { UserIdVO, SessionIdVO } from "../../domain/values/mod.js";
import type { DomainError } from "../../domain/errors.js";

type SetupUserDeps = {
  readonly userRepo: UserRepository;
  readonly sessionRepo: SessionRepository;
  readonly passwordHasher: PasswordHasher;
};

type SetupUserInput = {
  readonly username: string;
  readonly password: string;
};

type SetupUserResult = {
  readonly user: User;
  readonly session: Session;
};

export const setupUser =
  (deps: SetupUserDeps) =>
  (input: SetupUserInput): ResultAsync<SetupUserResult, DomainError> =>
    deps.userRepo
      .count()
      .andThen((count) =>
        count > 0
          ? err({ type: "SETUP_ALREADY_COMPLETED" as const, message: "Setup already completed" })
          : ok(undefined),
      )
      .andThen(() => deps.passwordHasher.hash(input.password))
      .andThen(({ hash, salt }) => {
        const user = UserEntity.create({
          id: UserIdVO.generate(),
          username: input.username,
          passwordHash: hash,
          passwordSalt: salt,
        });
        return deps.userRepo.save(user);
      })
      .andThen((user) => {
        const session = SessionEntity.create({
          id: SessionIdVO.generate(),
          userId: user.id,
        });
        return deps.sessionRepo.save(session).map((session) => ({ user, session }));
      });
