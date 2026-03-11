import type { ResultAsync } from "neverthrow";
import type { User } from "../entities/user.js";
import type { UserId } from "../values/user-id.js";
import type { DomainError } from "../errors.js";

export type UserRepository = {
  readonly findById: (id: UserId) => ResultAsync<User | null, DomainError>;
  readonly findByUsername: (username: string) => ResultAsync<User | null, DomainError>;
  readonly findByGithubId: (githubId: string) => ResultAsync<User | null, DomainError>;
  readonly findFirst: () => ResultAsync<User | null, DomainError>;
  readonly save: (user: User) => ResultAsync<User, DomainError>;
  readonly count: () => ResultAsync<number, DomainError>;
};
