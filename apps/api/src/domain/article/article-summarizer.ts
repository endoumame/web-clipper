import type { ResultAsync } from "neverthrow";
import type { DomainError } from "../shared/errors.js";

export type ArticleSummarizer = {
  readonly summarize: (text: string) => ResultAsync<string, DomainError>;
};
