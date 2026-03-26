import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";
import type { TagRepository } from "../../domain/tag/index.js";
import { err } from "neverthrow";

interface DeleteTagDeps {
  readonly tagRepo: TagRepository;
}

const deleteTag = (deps: DeleteTagDeps): ((id: string) => ResultAsync<void, DomainError>) => {
  const executeDeleteTag = (id: string): ResultAsync<void, DomainError> =>
    deps.tagRepo.findById(id).andThen((existing) => {
      if (existing) {
        return deps.tagRepo.deleteById(id);
      }
      return err({ id, type: "TAG_NOT_FOUND" as const });
    });
  return executeDeleteTag;
};

export { deleteTag };
