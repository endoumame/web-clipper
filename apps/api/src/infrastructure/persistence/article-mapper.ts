import { ArticleEntity, ArticleIdVO, ArticleUrlVO, SourceVO } from "../../domain/article/index.js";
import type { Article } from "../../domain/article/index.js";
import type { InferSelectModel } from "drizzle-orm";
import { TagNameVO } from "../../domain/tag/index.js";
import type { articles } from "./schema.js";

type ArticleRow = InferSelectModel<typeof articles>;

const articleToDomain = (row: ArticleRow, tagNames: string[]): Article =>
  ArticleEntity.reconstruct({
    aiSummary: row.aiSummary,
    createdAt: row.createdAt,
    description: row.description,
    id: ArticleIdVO.schema.parse(row.id),
    isRead: row.isRead,
    memo: row.memo,
    ogImageUrl: row.ogImageUrl,
    source: SourceVO.schema.parse(row.source),
    tags: tagNames.map((name) => TagNameVO.schema.parse(name)),
    title: row.title,
    updatedAt: row.updatedAt,
    url: ArticleUrlVO.schema.parse(row.url),
  });

const articleToPersistence = (
  article: Article,
): Omit<ArticleRow, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
} => ({
  aiSummary: article.aiSummary,
  createdAt: article.createdAt,
  description: article.description,
  id: article.id,
  isRead: article.isRead,
  memo: article.memo,
  ogImageUrl: article.ogImageUrl,
  source: article.source,
  title: article.title,
  updatedAt: article.updatedAt,
  url: article.url,
});

export { articleToDomain, articleToPersistence };
