import { ArticleEntity, ArticleId, ArticleUrl, Source } from "../../domain/article/index.js";
import type { Article } from "../../domain/article/index.js";
import type { InferSelectModel } from "drizzle-orm";
import { TagName } from "../../domain/tag/index.js";
import type { articles } from "./schema.js";

type ArticleRow = InferSelectModel<typeof articles>;

const articleToDomain = (row: ArticleRow, tagNames: string[]): Article =>
  ArticleEntity.reconstruct({
    aiSummary: row.aiSummary,
    content: row.content,
    createdAt: row.createdAt,
    description: row.description,
    id: ArticleId.schema.parse(row.id),
    isRead: row.isRead,
    memo: row.memo,
    ogImageUrl: row.ogImageUrl,
    source: Source.schema.parse(row.source),
    tags: tagNames.map((name) => TagName.schema.parse(name)),
    title: row.title,
    updatedAt: row.updatedAt,
    url: ArticleUrl.schema.parse(row.url),
  });

const articleToPersistence = (
  article: Article,
): Omit<ArticleRow, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
} => ({
  aiSummary: article.aiSummary,
  content: article.content,
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
