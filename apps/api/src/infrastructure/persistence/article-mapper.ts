import type { InferSelectModel } from "drizzle-orm";
import {
  ArticleIdVO,
  ArticleUrlVO,
  SourceVO,
  ArticleEntity,
  type Article,
} from "../../domain/article/index.js";
import { TagNameVO } from "../../domain/tag/index.js";
import type { articles } from "./schema.js";

type ArticleRow = InferSelectModel<typeof articles>;

export const articleToDomain = (row: ArticleRow, tagNames: string[]): Article =>
  ArticleEntity.reconstruct({
    id: ArticleIdVO.schema.parse(row.id),
    url: ArticleUrlVO.schema.parse(row.url),
    title: row.title,
    description: row.description,
    source: SourceVO.schema.parse(row.source),
    ogImageUrl: row.ogImageUrl,
    memo: row.memo,
    aiSummary: row.aiSummary,
    isRead: row.isRead,
    tags: tagNames.map((name) => TagNameVO.schema.parse(name)),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

export const articleToPersistence = (
  article: Article,
): Omit<ArticleRow, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
} => ({
  id: article.id,
  url: article.url,
  title: article.title,
  description: article.description,
  source: article.source,
  ogImageUrl: article.ogImageUrl,
  memo: article.memo,
  aiSummary: article.aiSummary,
  isRead: article.isRead,
  createdAt: article.createdAt,
  updatedAt: article.updatedAt,
});
