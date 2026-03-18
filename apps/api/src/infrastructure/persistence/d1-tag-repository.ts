import { ResultAsync } from "neverthrow";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { TagNameVO, type TagRepository, type Tag, type TagName } from "../../domain/tag/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import { tags } from "./schema.js";

const toStorageError = (error: unknown): DomainError => ({
  type: "STORAGE_ERROR",
  cause: error,
});

const toDomain = (row: { id: string; name: string; createdAt: Date }): Tag => ({
  id: row.id,
  name: TagNameVO.schema.parse(row.name),
  createdAt: row.createdAt,
});

export const createD1TagRepository = (db: DrizzleD1Database): TagRepository => ({
  findByName: (name: TagName): ResultAsync<Tag | null, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const row = await db.select().from(tags).where(eq(tags.name, name)).get();
        return row ? toDomain(row) : null;
      })(),
      toStorageError,
    ),

  findById: (id: string): ResultAsync<Tag | null, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const row = await db.select().from(tags).where(eq(tags.id, id)).get();
        return row ? toDomain(row) : null;
      })(),
      toStorageError,
    ),

  save: (tag: Tag): ResultAsync<Tag, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        await db
          .insert(tags)
          .values({
            id: tag.id,
            name: tag.name,
            createdAt: tag.createdAt,
          })
          .onConflictDoUpdate({
            target: tags.id,
            set: { name: tag.name },
          });
        return tag;
      })(),
      toStorageError,
    ),

  deleteById: (id: string): ResultAsync<void, DomainError> =>
    ResultAsync.fromPromise(
      db
        .delete(tags)
        .where(eq(tags.id, id))
        .run()
        .then(() => undefined),
      toStorageError,
    ),
});
