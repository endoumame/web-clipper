import type { DomainError } from "../shared/errors.js";
import type { ResultAsync } from "neverthrow";

interface ArticleSummarizer {
  readonly summarize: (text: string) => ResultAsync<string, DomainError>;
}

export type { ArticleSummarizer };
