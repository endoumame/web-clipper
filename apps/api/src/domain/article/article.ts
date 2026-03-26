import type { ArticleId } from "./article-id.js";
import type { ArticleUrl } from "./article-url.js";
import type { Source } from "./source.js";
import type { TagName } from "../tag/tag-name.js";

interface Article {
  readonly id: ArticleId;
  readonly url: ArticleUrl;
  readonly title: string;
  readonly description: string | null;
  readonly source: Source;
  readonly ogImageUrl: string | null;
  readonly memo: string | null;
  readonly aiSummary: string | null;
  readonly isRead: boolean;
  readonly tags: readonly TagName[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface CreateParams {
  readonly id: ArticleId;
  readonly url: ArticleUrl;
  readonly title: string;
  readonly description: string | null;
  readonly source: Source;
  readonly ogImageUrl: string | null;
  readonly memo: string | null;
  readonly tags: readonly TagName[];
}

const create = (params: CreateParams): Article => {
  const now = new Date();
  return {
    ...params,
    aiSummary: null,
    createdAt: now,
    isRead: false,
    tags: [...params.tags],
    updatedAt: now,
  };
};

const reconstruct = (params: Article): Article => ({
  ...params,
  tags: [...params.tags],
});

const markAsRead = (article: Article): Article => ({
  ...article,
  isRead: true,
  updatedAt: new Date(),
});

const markAsUnread = (article: Article): Article => ({
  ...article,
  isRead: false,
  updatedAt: new Date(),
});

const updateMemo = (article: Article, memo: string | null): Article => ({
  ...article,
  memo,
  updatedAt: new Date(),
});

const updateTags = (article: Article, newTags: readonly TagName[]): Article => ({
  ...article,
  tags: [...newTags],
  updatedAt: new Date(),
});

const updateAiSummary = (article: Article, aiSummary: string): Article => ({
  ...article,
  aiSummary,
  updatedAt: new Date(),
});

const ArticleEntity = {
  create,
  markAsRead,
  markAsUnread,
  reconstruct,
  updateAiSummary,
  updateMemo,
  updateTags,
} as const;

export { ArticleEntity };
export type { Article };
