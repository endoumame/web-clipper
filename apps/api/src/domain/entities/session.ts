import type { SessionId } from "../values/session-id.js";
import type { UserId } from "../values/user-id.js";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type Session = {
  readonly id: SessionId;
  readonly userId: UserId;
  readonly expiresAt: Date;
  readonly createdAt: Date;
};

type CreateParams = {
  readonly id: SessionId;
  readonly userId: UserId;
};

const create = (params: CreateParams): Session => ({
  id: params.id,
  userId: params.userId,
  expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  createdAt: new Date(),
});

const isExpired = (session: Session): boolean => session.expiresAt < new Date();

export const SessionEntity = {
  create,
  isExpired,
} as const;
