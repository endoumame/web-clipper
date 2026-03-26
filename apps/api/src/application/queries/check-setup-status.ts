import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";
import type { UserRepository } from "../../domain/user/index.js";

const EMPTY_COUNT = 0;

interface CheckSetupStatusDeps {
  readonly userRepo: UserRepository;
}

interface SetupStatusResult {
  readonly needsSetup: boolean;
}

const checkSetupStatus = (
  deps: CheckSetupStatusDeps,
): (() => ResultAsync<SetupStatusResult, DomainError>) =>
  function executeCheckSetupStatus(): ResultAsync<SetupStatusResult, DomainError> {
    return deps.userRepo.count().map((count) => ({
      needsSetup: count === EMPTY_COUNT,
    }));
  };

export { checkSetupStatus };
