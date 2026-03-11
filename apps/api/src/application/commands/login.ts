import { ok, err, type ResultAsync } from "neverthrow";
import type { UserRepository, SessionRepository, PasswordHasher } from "../../domain/ports/mod.js";
import { SessionEntity, type User, type Session } from "../../domain/entities/mod.js";
import { SessionIdVO } from "../../domain/values/mod.js";
import type { DomainError } from "../../domain/errors.js";

type LoginDeps = {
  readonly userRepo: UserRepository;
  readonly sessionRepo: SessionRepository;
  readonly passwordHasher: PasswordHasher;
};

type LoginInput = {
  readonly username: string;
  readonly password: string;
};

type LoginResult = {
  readonly user: User;
  readonly session: Session;
};

export const login =
  (deps: LoginDeps) =>
  (input: LoginInput): ResultAsync<LoginResult, DomainError> =>
    deps.userRepo
      .findByUsername(input.username)
      .andThen((user) =>
        user
          ? ok(user)
          : err({ type: "INVALID_CREDENTIALS" as const, message: "Invalid username or password" }),
      )
      .andThen((user) =>
        deps.passwordHasher
          .verify(input.password, user.passwordHash, user.passwordSalt)
          .andThen((valid) =>
            valid
              ? ok(user)
              : err({
                  type: "INVALID_CREDENTIALS" as const,
                  message: "Invalid username or password",
                }),
          ),
      )
      .andThen((user) =>
        deps.sessionRepo.deleteExpired().andThen(() => {
          const session = SessionEntity.create({
            id: SessionIdVO.generate(),
            userId: user.id,
          });
          return deps.sessionRepo.save(session).map((session) => ({ user, session }));
        }),
      );
