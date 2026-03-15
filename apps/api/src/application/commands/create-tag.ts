import { nanoid } from "nanoid";
import { err, type ResultAsync } from "neverthrow";
import type { TagRepository } from "../../domain/ports/mod.js";
import { TagNameVO } from "../../domain/values/tag-name.js";
import { TagEntity, type Tag } from "../../domain/entities/mod.js";
import type { DomainError } from "../../domain/errors.js";

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
