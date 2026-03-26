import type { ArticleUrl } from "./article-url.js";
import type { DomainError } from "../shared/errors.js";
import type { ResultAsync } from "neverthrow";

interface ArticleMetadata {
  readonly title: string;
  readonly description: string | null;
  readonly ogImageUrl: string | null;
}

interface MetadataFetcher {
  readonly fetch: (url: ArticleUrl) => ResultAsync<ArticleMetadata, DomainError>;
}

export type { ArticleMetadata, MetadataFetcher };
