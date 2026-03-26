import type { SessionId } from "./session-id.js";
import type { UserId } from "../user/user-id.js";

const DAYS_IN_SESSION = 30;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const SESSION_DURATION_MS =
  DAYS_IN_SESSION * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;

interface Session {
  readonly id: SessionId;
  readonly userId: UserId;
  readonly expiresAt: Date;
  readonly createdAt: Date;
}

interface CreateParams {
  readonly id: SessionId;
  readonly userId: UserId;
}

const create = (params: CreateParams): Session => ({
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  id: params.id,
  userId: params.userId,
});

const isExpired = (session: Session): boolean => session.expiresAt < new Date();

const SessionEntity = {
  create,
  isExpired,
} as const;

export { SessionEntity };
export type { Session };
