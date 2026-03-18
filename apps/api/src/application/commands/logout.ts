import type { ResultAsync } from "neverthrow";
import { type SessionRepository, SessionIdVO } from "../../domain/session/index.js";
import type { DomainError } from "../../domain/shared/index.js";

type LogoutDeps = {
  readonly sessionRepo: SessionRepository;
};

export const logout =
  (deps: LogoutDeps) =>
  (sessionId: string): ResultAsync<void, DomainError> =>
    SessionIdVO.create(sessionId).asyncAndThen((id) => deps.sessionRepo.deleteById(id));
