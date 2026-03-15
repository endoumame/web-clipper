import type { ResultAsync } from "neverthrow";
import type { Tag } from "../entities/tag.js";
import type { TagName } from "../values/tag-name.js";
import type { DomainError } from "../errors.js";

export type TagRepository = {
  readonly findByName: (name: TagName) => ResultAsync<Tag | null, DomainError>;
  readonly save: (tag: Tag) => ResultAsync<Tag, DomainError>;
  readonly deleteById: (id: string) => ResultAsync<void, DomainError>;
  readonly findById: (id: string) => ResultAsync<Tag | null, DomainError>;
};
