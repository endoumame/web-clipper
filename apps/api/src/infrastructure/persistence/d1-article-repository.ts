import { ResultAsync } from "neverthrow";
import { eq, inArray } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import type {
  ArticleRepository,
  Article,
  ArticleId,
  ArticleUrl,
} from "../../domain/article/index.js";
import type { DomainError } from "../../domain/shared/index.js";
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
          const existingTags = await db
            .select()
            .from(tags)
            .where(inArray(tags.name, article.tags))
            .all();
          const existingNames = new Set(existingTags.map((t) => t.name));
          const missingNames = article.tags.filter((name) => !existingNames.has(name));

          if (missingNames.length > 0) {
            const now = new Date();
            await db
              .insert(tags)
              .values(missingNames.map((name) => ({ id: nanoid(), name, createdAt: now })));
          }

          const allTags = await db
            .select()
            .from(tags)
            .where(inArray(tags.name, article.tags))
            .all();

          await db
            .insert(articleTags)
            .values(allTags.map((tag) => ({ articleId: article.id, tagId: tag.id })));
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
