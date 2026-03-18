import type { ResultAsync } from "neverthrow";
import type { UserRepository } from "../../domain/user/index.js";
import type { DomainError } from "../../domain/shared/index.js";

type CheckSetupStatusDeps = {
  readonly userRepo: UserRepository;
};

type SetupStatusResult = {
  readonly needsSetup: boolean;
};

export const checkSetupStatus =
  (deps: CheckSetupStatusDeps) => (): ResultAsync<SetupStatusResult, DomainError> =>
    deps.userRepo.count().map((count) => ({
      needsSetup: count === 0,
    }));
