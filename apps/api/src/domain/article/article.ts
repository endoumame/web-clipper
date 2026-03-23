import type { ArticleId } from "./article-id.js";
import type { ArticleUrl } from "./article-url.js";
import type { Source } from "./source.js";
import type { TagName } from "../tag/tag-name.js";

export type Article = {
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
};

type CreateParams = {
  readonly id: ArticleId;
  readonly url: ArticleUrl;
  readonly title: string;
  readonly description: string | null;
  readonly source: Source;
  readonly ogImageUrl: string | null;
  readonly memo: string | null;
  readonly tags: readonly TagName[];
};

const create = (params: CreateParams): Article => {
  const now = new Date();
  return {
    ...params,
    aiSummary: null,
    isRead: false,
    tags: [...params.tags],
    createdAt: now,
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

const updateTags = (article: Article, tags: readonly TagName[]): Article => ({
  ...article,
  tags: [...tags],
  updatedAt: new Date(),
});

const updateAiSummary = (article: Article, aiSummary: string): Article => ({
  ...article,
  aiSummary,
  updatedAt: new Date(),
});

export const ArticleEntity = {
  create,
  reconstruct,
  markAsRead,
  markAsUnread,
  updateMemo,
  updateTags,
  updateAiSummary,
} as const;
