import type { ArticleId } from "../article/article-id.js";
import type { DomainError } from "../shared/errors.js";
import type { Highlight } from "./highlight.js";
import type { HighlightId } from "./highlight-id.js";
import type { ResultAsync } from "neverthrow";

interface HighlightRepository {
  readonly findById: (id: HighlightId) => ResultAsync<Highlight | null, DomainError>;
  readonly findByArticleId: (
    articleId: ArticleId,
  ) => ResultAsync<readonly Highlight[], DomainError>;
  readonly save: (highlight: Highlight) => ResultAsync<Highlight, DomainError>;
  readonly delete: (id: HighlightId) => ResultAsync<void, DomainError>;
}

export type { HighlightRepository };
