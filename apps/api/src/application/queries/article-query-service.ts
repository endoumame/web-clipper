import type { Source } from "../../domain/article/source.js";

interface ArticleListItem {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly description: string | null;
  readonly source: Source;
  readonly ogImageUrl: string | null;
  readonly isRead: boolean;
  readonly createdAt: Date;
}

interface ListArticlesParams {
  readonly source?: string;
  readonly tagName?: string;
  readonly isRead?: boolean;
  readonly search?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

interface ListArticlesResult {
  readonly articles: readonly ArticleListItem[];
  readonly nextCursor: string | null;
}

interface ArticleDetail {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly description: string | null;
  readonly source: Source;
  readonly ogImageUrl: string | null;
  readonly memo: string | null;
  readonly aiSummary: string | null;
  readonly isRead: boolean;
  readonly tags: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface ArticleQueryService {
  readonly list: (params: ListArticlesParams) => Promise<ListArticlesResult>;
  readonly getById: (id: string) => Promise<ArticleDetail | null>;
}

export type {
  ArticleDetail,
  ArticleListItem,
  ArticleQueryService,
  ListArticlesParams,
  ListArticlesResult,
};
