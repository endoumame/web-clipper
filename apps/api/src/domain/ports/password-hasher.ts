import type { ResultAsync } from "neverthrow";
import type { DomainError } from "../errors.js";

export type PasswordHasher = {
  readonly hash: (password: string) => ResultAsync<{ hash: string; salt: string }, DomainError>;
  readonly verify: (password: string, hash: string, salt: string) => ResultAsync<boolean, DomainError>;
};
