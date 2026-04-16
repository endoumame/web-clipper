import type { DomainError } from "../shared/errors.js";
import type { ResultAsync } from "neverthrow";
import type { Tag } from "./tag.js";
import type { TagId } from "./tag-id.js";
import type { TagName } from "./tag-name.js";

interface TagRepository {
  readonly findByName: (name: TagName) => ResultAsync<Tag | null, DomainError>;
  readonly save: (tag: Tag) => ResultAsync<Tag, DomainError>;
  readonly deleteById: (id: TagId) => ResultAsync<void, DomainError>;
  readonly findById: (id: TagId) => ResultAsync<Tag | null, DomainError>;
}

export type { TagRepository };
