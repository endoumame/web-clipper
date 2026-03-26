import type {
  Article,
  ArticleId,
  ArticleRepository,
  ArticleUrl,
} from "../../domain/article/index.js";
import { articleTags, articles, tags } from "./schema.js";
import { articleToDomain, articleToPersistence } from "./article-mapper.js";
import { eq, inArray } from "drizzle-orm";
import type { DomainError } from "../../domain/shared/index.js";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { ResultAsync } from "neverthrow";
import { nanoid } from "nanoid";

const EMPTY_LENGTH = 0;

const toStorageError = (error: unknown): DomainError => ({
  cause: error,
  type: "STORAGE_ERROR",
});

const fetchTagNames = async (db: DrizzleD1Database, articleId: string): Promise<string[]> => {
  const rows = await db
    .select({ name: tags.name })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagId, tags.id))
    .where(eq(articleTags.articleId, articleId))
    .all();
  return rows.map((row) => row.name);
};

const syncTags = async (db: DrizzleD1Database, article: Article): Promise<void> => {
  // Sync tags: delete existing article-tag links, then re-insert
  await db.delete(articleTags).where(eq(articleTags.articleId, article.id));

  if (article.tags.length > EMPTY_LENGTH) {
    const existingTags = await db.select().from(tags).where(inArray(tags.name, article.tags)).all();
    const existingNames = new Set(existingTags.map((tag) => tag.name));
    const missingNames = article.tags.filter((name) => !existingNames.has(name));

    if (missingNames.length > EMPTY_LENGTH) {
      const now = new Date();
      await db
        .insert(tags)
        .values(missingNames.map((name) => ({ createdAt: now, id: nanoid(), name })));
    }

    const allTags = await db.select().from(tags).where(inArray(tags.name, article.tags)).all();

    await db
      .insert(articleTags)
      .values(allTags.map((tag) => ({ articleId: article.id, tagId: tag.id })));
  }
};

const createDeleteMethod =
  (db: DrizzleD1Database): ArticleRepository["delete"] =>
  (id: ArticleId): ResultAsync<void, DomainError> =>
    ResultAsync.fromPromise(
      db
        .delete(articles)
        .where(eq(articles.id, id))
        .run()
        .then((): void => {
          // No-op
        }),
      toStorageError,
    );

const createFindByIdMethod =
  (db: DrizzleD1Database): ArticleRepository["findById"] =>
  (id: ArticleId): ResultAsync<Article | null, DomainError> =>
    ResultAsync.fromPromise(
      (async (): Promise<Article | null> => {
        const row = await db.select().from(articles).where(eq(articles.id, id)).get();
        if (!row) {
          return null;
        }
        const tagNames = await fetchTagNames(db, id);
        return articleToDomain(row, tagNames);
      })(),
      toStorageError,
    );

const createFindByUrlMethod =
  (db: DrizzleD1Database): ArticleRepository["findByUrl"] =>
  (url: ArticleUrl): ResultAsync<Article | null, DomainError> =>
    ResultAsync.fromPromise(
      (async (): Promise<Article | null> => {
        const row = await db.select().from(articles).where(eq(articles.url, url)).get();
        if (!row) {
          return null;
        }
        const tagNames = await fetchTagNames(db, row.id);
        return articleToDomain(row, tagNames);
      })(),
      toStorageError,
    );

const createSaveMethod =
  (db: DrizzleD1Database): ArticleRepository["save"] =>
  (article: Article): ResultAsync<Article, DomainError> =>
    ResultAsync.fromPromise(
      (async (): Promise<Article> => {
        const row = articleToPersistence(article);
        await db.insert(articles).values(row).onConflictDoUpdate({
          set: row,
          target: articles.id,
        });
        await syncTags(db, article);
        return article;
      })(),
      toStorageError,
    );

const createRepository = (db: DrizzleD1Database): ArticleRepository => ({
  delete: createDeleteMethod(db),
  findById: createFindByIdMethod(db),
  findByUrl: createFindByUrlMethod(db),
  save: createSaveMethod(db),
});

export { createRepository as createD1ArticleRepository };
