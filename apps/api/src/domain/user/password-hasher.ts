import type { DomainError } from "../shared/errors.js";
import type { ResultAsync } from "neverthrow";

interface PasswordHasher {
  readonly hash: (password: string) => ResultAsync<{ hash: string; salt: string }, DomainError>;
  readonly verify: (
    password: string,
    hash: string,
    salt: string,
  ) => ResultAsync<boolean, DomainError>;
}

export type { PasswordHasher };
