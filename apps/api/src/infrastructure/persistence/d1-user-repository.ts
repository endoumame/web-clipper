import { ResultAsync } from "neverthrow";
import { eq, count } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { UserRepository } from "../../domain/ports/mod.js";
import type { User } from "../../domain/entities/mod.js";
import type { UserId } from "../../domain/values/mod.js";
import type { DomainError } from "../../domain/errors.js";
import { users } from "./schema.js";
import { userToDomain, userToPersistence } from "./mappers.js";

const toStorageError = (error: unknown): DomainError => ({
  type: "STORAGE_ERROR",
  cause: error,
});

export const createD1UserRepository = (db: DrizzleD1Database): UserRepository => ({
  findById: (id: UserId): ResultAsync<User | null, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const row = await db.select().from(users).where(eq(users.id, id)).get();
        if (!row) return null;
        return userToDomain(row);
      })(),
      toStorageError,
    ),

  findByUsername: (username: string): ResultAsync<User | null, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const row = await db.select().from(users).where(eq(users.username, username)).get();
        if (!row) return null;
        return userToDomain(row);
      })(),
      toStorageError,
    ),

  findByGithubId: (githubId: string): ResultAsync<User | null, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const row = await db.select().from(users).where(eq(users.githubId, githubId)).get();
        if (!row) return null;
        return userToDomain(row);
      })(),
      toStorageError,
    ),

  findFirst: (): ResultAsync<User | null, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const row = await db.select().from(users).limit(1).get();
        if (!row) return null;
        return userToDomain(row);
      })(),
      toStorageError,
    ),

  save: (user: User): ResultAsync<User, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const row = userToPersistence(user);
        await db.insert(users).values(row).onConflictDoUpdate({
          target: users.id,
          set: row,
        });
        return user;
      })(),
      toStorageError,
    ),

  count: (): ResultAsync<number, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const result = await db.select({ value: count() }).from(users).get();
        return result?.value ?? 0;
      })(),
      toStorageError,
    ),
});
