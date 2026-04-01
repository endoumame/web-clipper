import type { DomainError } from "../shared/errors.js";
import type { ResultAsync } from "neverthrow";
import type { TagName } from "./tag-name.js";

interface TagSuggestionInput {
  readonly title: string;
  readonly description: string | null;
  readonly content: string;
  readonly existingTags: readonly TagName[];
}

interface TagSuggester {
  readonly suggest: (input: TagSuggestionInput) => ResultAsync<readonly TagName[], DomainError>;
}

export type { TagSuggester, TagSuggestionInput };
