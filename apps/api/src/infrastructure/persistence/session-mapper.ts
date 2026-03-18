import type { InferSelectModel } from "drizzle-orm";
import { SessionIdVO, type Session } from "../../domain/session/index.js";
import { UserIdVO } from "../../domain/user/index.js";
import type { sessions } from "./schema.js";

type SessionRow = InferSelectModel<typeof sessions>;

export const sessionToDomain = (row: SessionRow): Session => ({
  id: SessionIdVO.schema.parse(row.id),
  userId: UserIdVO.schema.parse(row.userId),
  expiresAt: row.expiresAt,
  createdAt: row.createdAt,
});

export const sessionToPersistence = (
  session: Session,
): Omit<SessionRow, "expiresAt" | "createdAt"> & {
  expiresAt: Date;
  createdAt: Date;
} => ({
  id: session.id,
  userId: session.userId,
  expiresAt: session.expiresAt,
  createdAt: session.createdAt,
});
