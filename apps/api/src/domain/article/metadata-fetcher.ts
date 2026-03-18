import type { ResultAsync } from "neverthrow";
import type { ArticleUrl } from "./article-url.js";
import type { DomainError } from "../shared/errors.js";

export type ArticleMetadata = {
  readonly title: string;
  readonly description: string | null;
  readonly ogImageUrl: string | null;
};

export type MetadataFetcher = {
  readonly fetch: (url: ArticleUrl) => ResultAsync<ArticleMetadata, DomainError>;
};
