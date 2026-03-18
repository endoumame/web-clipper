export type ArticleListItem = {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly description: string | null;
  readonly source: string;
  readonly ogImageUrl: string | null;
  readonly isRead: boolean;
  readonly createdAt: Date;
};

export type ListArticlesParams = {
  readonly source?: string;
  readonly tagName?: string;
  readonly isRead?: boolean;
  readonly search?: string;
  readonly cursor?: string;
  readonly limit?: number;
};

export type ListArticlesResult = {
  readonly articles: readonly ArticleListItem[];
  readonly nextCursor: string | null;
};

export type ArticleDetail = {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly description: string | null;
  readonly source: string;
  readonly ogImageUrl: string | null;
  readonly memo: string | null;
  readonly isRead: boolean;
  readonly tags: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ArticleQueryService = {
  readonly list: (params: ListArticlesParams) => Promise<ListArticlesResult>;
  readonly getById: (id: string) => Promise<ArticleDetail | null>;
};
