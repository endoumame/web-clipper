import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";
import { SessionIdVO } from "../../domain/session/index.js";
import type { SessionRepository } from "../../domain/session/index.js";

interface LogoutDeps {
  readonly sessionRepo: SessionRepository;
}

const logout = (deps: LogoutDeps): ((sessionId: string) => ResultAsync<void, DomainError>) =>
  function executeLogout(sessionId: string): ResultAsync<void, DomainError> {
    return SessionIdVO.create(sessionId).asyncAndThen((id) => deps.sessionRepo.deleteById(id));
  };

export { logout };
