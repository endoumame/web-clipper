import { ResultAsync } from "neverthrow";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import type { ArticleRepository } from "../../domain/ports/mod.js";
import type { Article } from "../../domain/entities/mod.js";
import type { ArticleId, ArticleUrl } from "../../domain/values/mod.js";
import type { DomainError } from "../../domain/errors.js";
import { articles, tags, articleTags } from "./schema.js";
import { toDomain, toPersistence } from "./mappers.js";

const toStorageError = (error: unknown): DomainError => ({
  type: "STORAGE_ERROR",
  cause: error,
});

const fetchTagNames = async (db: DrizzleD1Database, articleId: string): Promise<string[]> => {
  const rows = await db
    .select({ name: tags.name })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagId, tags.id))
    .where(eq(articleTags.articleId, articleId))
    .all();
  return rows.map((r) => r.name);
};

export const createD1ArticleRepository = (db: DrizzleD1Database): ArticleRepository => ({
  findById: (id: ArticleId): ResultAsync<Article | null, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const row = await db.select().from(articles).where(eq(articles.id, id)).get();
        if (!row) return null;
        const tagNames = await fetchTagNames(db, id);
        return toDomain(row, tagNames);
      })(),
      toStorageError,
    ),

  findByUrl: (url: ArticleUrl): ResultAsync<Article | null, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const row = await db.select().from(articles).where(eq(articles.url, url)).get();
        if (!row) return null;
        const tagNames = await fetchTagNames(db, row.id);
        return toDomain(row, tagNames);
      })(),
      toStorageError,
    ),

  save: (article: Article): ResultAsync<Article, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const row = toPersistence(article);
        await db.insert(articles).values(row).onConflictDoUpdate({
          target: articles.id,
          set: row,
        });

        // Sync tags: delete existing article-tag links, then re-insert
        await db.delete(articleTags).where(eq(articleTags.articleId, article.id));

        if (article.tags.length > 0) {
          for (const tagName of article.tags) {
            let tag = await db.select().from(tags).where(eq(tags.name, tagName)).get();
            if (!tag) {
              const now = new Date();
              await db.insert(tags).values({ id: nanoid(), name: tagName, createdAt: now });
              tag = await db.select().from(tags).where(eq(tags.name, tagName)).get();
            }
            if (tag) {
              await db.insert(articleTags).values({
                articleId: article.id,
                tagId: tag.id,
              });
            }
          }
        }

        return article;
      })(),
      toStorageError,
    ),

  delete: (id: ArticleId): ResultAsync<void, DomainError> =>
    ResultAsync.fromPromise(
      db
        .delete(articles)
        .where(eq(articles.id, id))
        .run()
        .then(() => undefined),
      toStorageError,
    ),
});
