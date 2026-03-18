import { nanoid } from "nanoid";
import { err, type ResultAsync } from "neverthrow";
import { type TagRepository, TagNameVO, TagEntity, type Tag } from "../../domain/tag/index.js";
import type { DomainError } from "../../domain/shared/index.js";

type CreateTagDeps = {
  readonly tagRepo: TagRepository;
};

export const createTag =
  (deps: CreateTagDeps) =>
  (name: string): ResultAsync<Tag, DomainError> =>
    TagNameVO.create(name).asyncAndThen((validName) =>
      deps.tagRepo.findByName(validName).andThen((existing) =>
        existing
          ? err({ type: "TAG_ALREADY_EXISTS" as const, name })
          : (() => {
              const tag = TagEntity.create({ id: nanoid(), name: validName });
              return deps.tagRepo.save(tag);
            })(),
      ),
    );
