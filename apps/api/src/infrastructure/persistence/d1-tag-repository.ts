import type { Tag, TagName, TagRepository } from "../../domain/tag/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { ResultAsync } from "neverthrow";
import { TagNameVO } from "../../domain/tag/index.js";
import { eq } from "drizzle-orm";
import { tags } from "./schema.js";

const toStorageError = (error: unknown): DomainError => ({
  cause: error,
  type: "STORAGE_ERROR",
});

const toDomain = (row: { id: string; name: string; createdAt: Date }): Tag => ({
  createdAt: row.createdAt,
  id: row.id,
  name: TagNameVO.schema.parse(row.name),
});

const deleteTagById = (db: DrizzleD1Database, id: string): ResultAsync<void, DomainError> =>
  ResultAsync.fromPromise(
    db
      .delete(tags)
      .where(eq(tags.id, id))
      .run()
      .then(() => {
        // Void return
      }),
    toStorageError,
  );

const findTagByColumn = (
  db: DrizzleD1Database,
  condition: () => ReturnType<typeof eq>,
): ResultAsync<Tag | null, DomainError> =>
  ResultAsync.fromPromise(
    (async (): Promise<Tag | null> => {
      const row = await db.select().from(tags).where(condition()).get();
      if (row) {
        return toDomain(row);
      }
      return null;
    })(),
    toStorageError,
  );

const saveTag = (db: DrizzleD1Database, tag: Tag): ResultAsync<Tag, DomainError> =>
  ResultAsync.fromPromise(
    (async (): Promise<Tag> => {
      await db
        .insert(tags)
        .values({
          createdAt: tag.createdAt,
          id: tag.id,
          name: tag.name,
        })
        .onConflictDoUpdate({
          set: { name: tag.name },
          target: tags.id,
        });
      return tag;
    })(),
    toStorageError,
  );

export const createD1TagRepository = (db: DrizzleD1Database): TagRepository => ({
  deleteById: (id: string): ResultAsync<void, DomainError> => deleteTagById(db, id),

  findById: (id: string): ResultAsync<Tag | null, DomainError> =>
    findTagByColumn(db, () => eq(tags.id, id)),

  findByName: (name: TagName): ResultAsync<Tag | null, DomainError> =>
    findTagByColumn(db, () => eq(tags.name, name)),

  save: (tag: Tag): ResultAsync<Tag, DomainError> => saveTag(db, tag),
});
