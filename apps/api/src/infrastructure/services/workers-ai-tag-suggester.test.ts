// oxlint-disable typescript/no-unsafe-call, typescript/no-unsafe-member-access -- vitest globals (describe/it/expect) are injected at runtime via globals:true in vitest.config.ts
import { parseTagSuggestions } from "./workers-ai-tag-suggester.js";

const TAG_NAME_OVER_MAX_LENGTH = 51;

describe(parseTagSuggestions, () => {
  it("parses a valid JSON array of tag names", () => {
    const result = parseTagSuggestions('["TypeScript", "React", "Frontend"]');
    expect(result).toEqual(["TypeScript", "React", "Frontend"]);
  });

  it("extracts JSON array from surrounding text", () => {
    const result = parseTagSuggestions('Here are the tags: ["TypeScript", "React"]');
    expect(result).toEqual(["TypeScript", "React"]);
  });

  it("skips invalid tag names (empty strings, too long)", () => {
    const tooLong = "a".repeat(TAG_NAME_OVER_MAX_LENGTH);
    const result = parseTagSuggestions(`["valid", "", "${tooLong}"]`);
    expect(result).toEqual(["valid"]);
  });

  it("returns empty array when no JSON array found", () => {
    const result = parseTagSuggestions("no tags here");
    expect(result).toEqual([]);
  });

  it("returns empty array for non-string array elements", () => {
    const result = parseTagSuggestions("[1, 2, 3]");
    expect(result).toEqual([]);
  });

  it("trims whitespace from tag names", () => {
    const result = parseTagSuggestions('[" TypeScript ", " React "]');
    expect(result).toEqual(["TypeScript", "React"]);
  });
});
