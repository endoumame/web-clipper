import { ResultAsync } from "neverthrow";
import { eq, lt } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { SessionRepository } from "../../domain/ports/mod.js";
import type { Session } from "../../domain/entities/mod.js";
import type { SessionId } from "../../domain/values/mod.js";
import type { DomainError } from "../../domain/errors.js";
import { sessions } from "./schema.js";
import { sessionToDomain, sessionToPersistence } from "./mappers.js";

const toStorageError = (error: unknown): DomainError => ({
  type: "STORAGE_ERROR",
  cause: error,
});

export const createD1SessionRepository = (db: DrizzleD1Database): SessionRepository => ({
  findById: (id: SessionId): ResultAsync<Session | null, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const row = await db.select().from(sessions).where(eq(sessions.id, id)).get();
        if (!row) return null;
        return sessionToDomain(row);
      })(),
      toStorageError,
    ),

  save: (session: Session): ResultAsync<Session, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const row = sessionToPersistence(session);
        await db.insert(sessions).values(row);
        return session;
      })(),
      toStorageError,
    ),

  deleteById: (id: SessionId): ResultAsync<void, DomainError> =>
    ResultAsync.fromPromise(
      db
        .delete(sessions)
        .where(eq(sessions.id, id))
        .run()
        .then(() => undefined),
      toStorageError,
    ),

  deleteExpired: (): ResultAsync<void, DomainError> =>
    ResultAsync.fromPromise(
      db
        .delete(sessions)
        .where(lt(sessions.expiresAt, new Date()))
        .run()
        .then(() => undefined),
      toStorageError,
    ),
});
