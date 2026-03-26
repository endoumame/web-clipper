import type { Article } from "./article.js";
import type { ArticleId } from "./article-id.js";
import type { ArticleUrl } from "./article-url.js";
import type { DomainError } from "../shared/errors.js";
import type { ResultAsync } from "neverthrow";

interface ArticleRepository {
  readonly findById: (id: ArticleId) => ResultAsync<Article | null, DomainError>;
  readonly findByUrl: (url: ArticleUrl) => ResultAsync<Article | null, DomainError>;
  readonly save: (article: Article) => ResultAsync<Article, DomainError>;
  readonly delete: (id: ArticleId) => ResultAsync<void, DomainError>;
}

export type { ArticleRepository };
