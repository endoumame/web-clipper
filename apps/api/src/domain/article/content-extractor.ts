import type { ResultAsync } from "neverthrow";
import type { ArticleUrl } from "./article-url.js";
import type { DomainError } from "../shared/errors.js";

export type ContentExtractor = {
  readonly extract: (url: ArticleUrl) => ResultAsync<string, DomainError>;
};
