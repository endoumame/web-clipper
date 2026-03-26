import type { ArticleUrl } from "./article-url.js";
import type { DomainError } from "../shared/errors.js";
import type { ResultAsync } from "neverthrow";

interface ContentExtractor {
  readonly extract: (url: ArticleUrl) => ResultAsync<string, DomainError>;
}

export type { ContentExtractor };
