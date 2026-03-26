import type { DomainError } from "../shared/errors.js";
import type { ResultAsync } from "neverthrow";
import type { Session } from "./session.js";
import type { SessionId } from "./session-id.js";

interface SessionRepository {
  readonly findById: (id: SessionId) => ResultAsync<Session | null, DomainError>;
  readonly save: (session: Session) => ResultAsync<Session, DomainError>;
  readonly deleteById: (id: SessionId) => ResultAsync<void, DomainError>;
  readonly deleteExpired: () => ResultAsync<void, DomainError>;
}

export type { SessionRepository };
