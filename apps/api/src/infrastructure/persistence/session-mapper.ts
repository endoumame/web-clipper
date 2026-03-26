import type { InferSelectModel } from "drizzle-orm";
import type { Session } from "../../domain/session/index.js";
import { SessionIdVO } from "../../domain/session/index.js";
import { UserIdVO } from "../../domain/user/index.js";
import type { sessions } from "./schema.js";

type SessionRow = InferSelectModel<typeof sessions>;

const sessionToDomain = (row: SessionRow): Session => ({
  createdAt: row.createdAt,
  expiresAt: row.expiresAt,
  id: SessionIdVO.schema.parse(row.id),
  userId: UserIdVO.schema.parse(row.userId),
});

const sessionToPersistence = (
  session: Session,
): Omit<SessionRow, "expiresAt" | "createdAt"> & {
  expiresAt: Date;
  createdAt: Date;
} => ({
  createdAt: session.createdAt,
  expiresAt: session.expiresAt,
  id: session.id,
  userId: session.userId,
});

export { sessionToDomain, sessionToPersistence };
