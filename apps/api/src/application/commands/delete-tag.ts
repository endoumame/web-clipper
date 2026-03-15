import { err, type ResultAsync } from "neverthrow";
import type { TagRepository } from "../../domain/ports/mod.js";
import type { DomainError } from "../../domain/errors.js";

type DeleteTagDeps = {
  readonly tagRepo: TagRepository;
};

export const deleteTag =
  (deps: DeleteTagDeps) =>
  (id: string): ResultAsync<void, DomainError> =>
    deps.tagRepo
      .findById(id)
      .andThen((existing) =>
        existing ? deps.tagRepo.deleteById(id) : err({ type: "TAG_NOT_FOUND" as const, id }),
      );
