import type { Tag, TagRepository } from "../../domain/tag/index.js";
import { TagEntity, TagIdVO, TagNameVO } from "../../domain/tag/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";
import { err } from "neverthrow";

interface CreateTagDeps {
  readonly tagRepo: TagRepository;
}

export const createTag =
  (deps: CreateTagDeps) =>
  (name: string): ResultAsync<Tag, DomainError> =>
    TagNameVO.create(name).asyncAndThen((validName) =>
      deps.tagRepo.findByName(validName).andThen((existing) => {
        if (existing) {
          return err({ name, type: "TAG_ALREADY_EXISTS" as const });
        }
        const tag = TagEntity.create({ id: TagIdVO.generate(), name: validName });
        return deps.tagRepo.save(tag);
      }),
    );
