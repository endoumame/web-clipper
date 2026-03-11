import type { ResultAsync } from "neverthrow";
import type { SessionRepository } from "../../domain/ports/mod.js";
import { SessionIdVO } from "../../domain/values/mod.js";
import type { DomainError } from "../../domain/errors.js";

type LogoutDeps = {
  readonly sessionRepo: SessionRepository;
};

export const logout =
  (deps: LogoutDeps) =>
  (sessionId: string): ResultAsync<void, DomainError> =>
    SessionIdVO.create(sessionId).asyncAndThen((id) => deps.sessionRepo.deleteById(id));
