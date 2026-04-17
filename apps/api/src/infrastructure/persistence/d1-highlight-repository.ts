import type { Highlight, HighlightRepository } from "../../domain/highlight/index.js";
import { HighlightEntity, HighlightId } from "../../domain/highlight/index.js";
import { ArticleId } from "../../domain/article/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { ResultAsync } from "neverthrow";
import { eq } from "drizzle-orm";
import { highlights } from "./schema.js";

const toStorageError = (error: unknown): DomainError => ({
  cause: error,
  type: "STORAGE_ERROR",
});

const toDomain = (row: typeof highlights.$inferSelect): Highlight =>
  HighlightEntity.reconstruct({
    articleId: ArticleId.schema.parse(row.articleId),
    color: row.color,
    createdAt: row.createdAt,
    endOffset: row.endOffset,
    highlightedText: row.highlightedText,
    id: HighlightId.schema.parse(row.id),
    note: row.note,
    prefixContext: row.prefixContext,
    startOffset: row.startOffset,
    suffixContext: row.suffixContext,
    updatedAt: row.updatedAt,
  });

const toPersistence = (highlight: Highlight): typeof highlights.$inferInsert => ({
  articleId: highlight.articleId,
  color: highlight.color,
  createdAt: highlight.createdAt,
  endOffset: highlight.endOffset,
  highlightedText: highlight.highlightedText,
  id: highlight.id,
  note: highlight.note,
  prefixContext: highlight.prefixContext,
  startOffset: highlight.startOffset,
  suffixContext: highlight.suffixContext,
  updatedAt: highlight.updatedAt,
});

const createRepository = (db: DrizzleD1Database): HighlightRepository => ({
  delete: (id: HighlightId): ResultAsync<void, DomainError> =>
    ResultAsync.fromPromise(
      db
        .delete(highlights)
        .where(eq(highlights.id, id))
        .run()
        .then((): void => {
          // No-op
        }),
      toStorageError,
    ),

  findByArticleId: (articleId: ArticleId): ResultAsync<readonly Highlight[], DomainError> =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(highlights)
        .where(eq(highlights.articleId, articleId))
        .all()
        .then((rows) => rows.map((row) => toDomain(row))),
      toStorageError,
    ),

  findById: (id: HighlightId): ResultAsync<Highlight | null, DomainError> =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(highlights)
        .where(eq(highlights.id, id))
        .get()
        .then((row) => (row ? toDomain(row) : null)),
      toStorageError,
    ),

  save: (highlight: Highlight): ResultAsync<Highlight, DomainError> =>
    ResultAsync.fromPromise(
      (async (): Promise<Highlight> => {
        const row = toPersistence(highlight);
        await db.insert(highlights).values(row).onConflictDoUpdate({
          set: row,
          target: highlights.id,
        });
        return highlight;
      })(),
      toStorageError,
    ),
});

export { createRepository as createD1HighlightRepository };
