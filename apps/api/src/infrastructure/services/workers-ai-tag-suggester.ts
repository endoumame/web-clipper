import type { TagName, TagSuggester, TagSuggestionInput } from "../../domain/tag/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import { ResultAsync } from "neverthrow";
import { TagNameVO } from "../../domain/tag/index.js";

const SLICE_START = 0;
const MAX_TEXT_LENGTH = 6000;
const MAX_TAGS = 5;

const SYSTEM_PROMPT = `You are a tag suggestion assistant for a web article clipper.
Given an article's title, description, content, and a list of existing tags, suggest the most appropriate tags.

Rules:
- Prefer existing tags when they match the article's topic
- Only suggest new tags if none of the existing tags are a good fit
- Return between 1 and ${MAX_TAGS} tags
- Keep new tag names short (1-3 words), lowercase
- Respond with ONLY a JSON array of strings, no other text
- Example: ["typescript", "react", "frontend"]`;

const buildUserPrompt = (input: TagSuggestionInput): string => {
  const truncated = input.content.slice(SLICE_START, MAX_TEXT_LENGTH);
  const existingTagNames = input.existingTags.join(", ");
  return [
    `Title: ${input.title}`,
    `Description: ${input.description ?? "(none)"}`,
    `Existing tags in the system: [${existingTagNames}]`,
    `Article content:\n${truncated}`,
  ].join("\n\n");
};

const REGEX_FULL_MATCH = 0;

const tryParseJsonArray = (raw: string): unknown[] | null => {
  const match = /\[[\s\S]*\]/.exec(raw);
  if (!match) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(match[REGEX_FULL_MATCH]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const validateTagItem = (item: unknown): TagName | null => {
  if (typeof item !== "string") {
    return null;
  }
  const result = TagNameVO.create(item);
  return result.isOk() ? result.value : null;
};

const validateTagItems = (items: unknown[]): TagName[] =>
  items.flatMap((item) => {
    const tag = validateTagItem(item);
    return tag === null ? [] : [tag];
  });

const parseTagSuggestions = (raw: string): TagName[] => {
  const items = tryParseJsonArray(raw);
  if (!items) {
    return [];
  }
  return validateTagItems(items);
};

const createWorkersAiTagSuggester = (ai: Ai): TagSuggester => ({
  suggest: (input: TagSuggestionInput): ResultAsync<readonly TagName[], DomainError> =>
    ResultAsync.fromPromise(
      (async (): Promise<readonly TagName[]> => {
        const response = await ai.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
          messages: [
            { content: SYSTEM_PROMPT, role: "system" },
            { content: buildUserPrompt(input), role: "user" },
          ],
        });
        if (typeof response === "object" && response !== null && "response" in response) {
          const typed = response as Record<string, unknown>;
          const tags = parseTagSuggestions(String(typed.response));
          return tags.slice(SLICE_START, MAX_TAGS);
        }
        throw new Error("Unexpected AI response format");
      })(),
      (error: unknown): DomainError => {
        let causeMessage = String(error);
        if (error instanceof Error) {
          causeMessage = error.message;
        }
        return {
          cause: causeMessage,
          type: "TAG_SUGGESTION_FAILED",
        };
      },
    ),
});

export { createWorkersAiTagSuggester, parseTagSuggestions };
