import type { User, UserId, UserRepository } from "../../domain/user/index.js";
import { count, eq } from "drizzle-orm";
import { userToDomain, userToPersistence } from "./user-mapper.js";
import type { DomainError } from "../../domain/shared/index.js";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { ResultAsync } from "neverthrow";
import { users } from "./schema.js";

const DEFAULT_COUNT = 0;
const SINGLE_ROW_LIMIT = 1;

const toStorageError = (error: unknown): DomainError => ({
  cause: error,
  type: "STORAGE_ERROR",
});

const queryUserCount = (db: DrizzleD1Database): ResultAsync<number, DomainError> =>
  ResultAsync.fromPromise(
    (async (): Promise<number> => {
      const result = await db.select({ value: count() }).from(users).get();
      return result?.value ?? DEFAULT_COUNT;
    })(),
    toStorageError,
  );

const queryUserByColumn = (
  db: DrizzleD1Database,
  column: ReturnType<typeof eq> extends infer EqResult ? () => EqResult : never,
): ResultAsync<User | null, DomainError> =>
  ResultAsync.fromPromise(
    (async (): Promise<User | null> => {
      const row = await db.select().from(users).where(column()).get();
      if (!row) {
        return null;
      }
      return userToDomain(row);
    })(),
    toStorageError,
  );

const queryFirstUser = (db: DrizzleD1Database): ResultAsync<User | null, DomainError> =>
  ResultAsync.fromPromise(
    (async (): Promise<User | null> => {
      const row = await db.select().from(users).limit(SINGLE_ROW_LIMIT).get();
      if (!row) {
        return null;
      }
      return userToDomain(row);
    })(),
    toStorageError,
  );

const saveUser = (db: DrizzleD1Database, user: User): ResultAsync<User, DomainError> =>
  ResultAsync.fromPromise(
    (async (): Promise<User> => {
      const row = userToPersistence(user);
      await db.insert(users).values(row).onConflictDoUpdate({
        set: row,
        target: users.id,
      });
      return user;
    })(),
    toStorageError,
  );

export const createD1UserRepository = (db: DrizzleD1Database): UserRepository => ({
  count: (): ResultAsync<number, DomainError> => queryUserCount(db),

  findByGithubId: (githubId: string): ResultAsync<User | null, DomainError> =>
    queryUserByColumn(db, () => eq(users.githubId, githubId)),

  findById: (id: UserId): ResultAsync<User | null, DomainError> =>
    queryUserByColumn(db, () => eq(users.id, id)),

  findByUsername: (username: string): ResultAsync<User | null, DomainError> =>
    queryUserByColumn(db, () => eq(users.username, username)),

  findFirst: (): ResultAsync<User | null, DomainError> => queryFirstUser(db),

  save: (user: User): ResultAsync<User, DomainError> => saveUser(db, user),
});
