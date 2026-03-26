import type { Session, SessionId, SessionRepository } from "../../domain/session/index.js";
import { eq, lt } from "drizzle-orm";
import { sessionToDomain, sessionToPersistence } from "./session-mapper.js";
import type { DomainError } from "../../domain/shared/index.js";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { ResultAsync } from "neverthrow";
import { sessions } from "./schema.js";

const toStorageError = (error: unknown): DomainError => ({
  cause: error,
  type: "STORAGE_ERROR",
});

export const createD1SessionRepository = (db: DrizzleD1Database): SessionRepository => ({
  deleteById: (id: SessionId): ResultAsync<void, DomainError> =>
    ResultAsync.fromPromise(
      db
        .delete(sessions)
        .where(eq(sessions.id, id))
        .run()
        .then(() => {
          // Void return
        }),
      toStorageError,
    ),

  deleteExpired: (): ResultAsync<void, DomainError> =>
    ResultAsync.fromPromise(
      db
        .delete(sessions)
        .where(lt(sessions.expiresAt, new Date()))
        .run()
        .then(() => {
          // Void return
        }),
      toStorageError,
    ),

  findById: (id: SessionId): ResultAsync<Session | null, DomainError> =>
    ResultAsync.fromPromise(
      (async (): Promise<Session | null> => {
        const row = await db.select().from(sessions).where(eq(sessions.id, id)).get();
        if (!row) {
          return null;
        }
        return sessionToDomain(row);
      })(),
      toStorageError,
    ),

  save: (session: Session): ResultAsync<Session, DomainError> =>
    ResultAsync.fromPromise(
      (async (): Promise<Session> => {
        const row = sessionToPersistence(session);
        await db.insert(sessions).values(row);
        return session;
      })(),
      toStorageError,
    ),
});
