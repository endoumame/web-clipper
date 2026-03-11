import type { ResultAsync } from "neverthrow";
import type { Session } from "../entities/session.js";
import type { SessionId } from "../values/session-id.js";
import type { DomainError } from "../errors.js";

export type SessionRepository = {
  readonly findById: (id: SessionId) => ResultAsync<Session | null, DomainError>;
  readonly save: (session: Session) => ResultAsync<Session, DomainError>;
  readonly deleteById: (id: SessionId) => ResultAsync<void, DomainError>;
  readonly deleteExpired: () => ResultAsync<void, DomainError>;
};
