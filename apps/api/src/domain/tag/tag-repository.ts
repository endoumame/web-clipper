import type { DomainError } from "../shared/errors.js";
import type { ResultAsync } from "neverthrow";
import type { Tag } from "./tag.js";
import type { TagName } from "./tag-name.js";

interface TagRepository {
  readonly findByName: (name: TagName) => ResultAsync<Tag | null, DomainError>;
  readonly save: (tag: Tag) => ResultAsync<Tag, DomainError>;
  readonly deleteById: (id: string) => ResultAsync<void, DomainError>;
  readonly findById: (id: string) => ResultAsync<Tag | null, DomainError>;
}

export type { TagRepository };
