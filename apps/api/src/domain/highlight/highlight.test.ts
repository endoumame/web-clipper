// oxlint-disable typescript/no-unsafe-type-assertion, no-magic-numbers, max-lines-per-function, max-statements -- test file uses intentional type casts and inline test values
import type { ArticleId } from "../article/article-id.js";
import type { Highlight } from "./highlight.js";
import { HighlightEntity } from "./highlight.js";
import type { HighlightId } from "./highlight-id.js";

const MOCK_HIGHLIGHT_ID = "hl-1" as HighlightId;
const MOCK_ARTICLE_ID = "article-1" as ArticleId;
const START = 10;
const END = 50;

const createTestHighlight = (
  overrides?: Partial<Parameters<typeof HighlightEntity.create>[0]>,
): Highlight =>
  HighlightEntity.create({
    articleId: MOCK_ARTICLE_ID,
    endOffset: END,
    highlightedText: "selected text",
    id: MOCK_HIGHLIGHT_ID,
    note: null,
    prefixContext: "",
    startOffset: START,
    suffixContext: "",
    ...overrides,
  });

describe(HighlightEntity.create, () => {
  it("creates a highlight with default color when color is not provided", () => {
    const highlight = createTestHighlight({
      prefixContext: "before ",
      suffixContext: " after",
    });

    expect(highlight.id).toBe(MOCK_HIGHLIGHT_ID);
    expect(highlight.articleId).toBe(MOCK_ARTICLE_ID);
    expect(highlight.highlightedText).toBe("selected text");
    expect(highlight.note).toBeNull();
    expect(highlight.startOffset).toBe(START);
    expect(highlight.endOffset).toBe(END);
    expect(highlight.prefixContext).toBe("before ");
    expect(highlight.suffixContext).toBe(" after");
    expect(highlight.color).toBe("yellow");
    expect(highlight.createdAt).toBeInstanceOf(Date);
    expect(highlight.updatedAt).toBeInstanceOf(Date);
  });

  it("creates a highlight with a custom color", () => {
    const highlight = createTestHighlight({ color: "green", note: "my note" });

    expect(highlight.color).toBe("green");
    expect(highlight.note).toBe("my note");
  });
});

describe(HighlightEntity.updateNote, () => {
  it("updates the note and updatedAt timestamp", () => {
    const original = createTestHighlight();
    const updated = HighlightEntity.updateNote(original, "new note");

    expect(updated.note).toBe("new note");
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
    expect(updated.highlightedText).toBe("selected text");
  });

  it("can clear the note by setting null", () => {
    const original = createTestHighlight({ note: "existing note" });
    const updated = HighlightEntity.updateNote(original, null);

    expect(updated.note).toBeNull();
  });
});

describe(HighlightEntity.updateColor, () => {
  it("updates the color and updatedAt timestamp", () => {
    const original = createTestHighlight();
    const updated = HighlightEntity.updateColor(original, "blue");

    expect(updated.color).toBe("blue");
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
  });
});

describe(HighlightEntity.reconstruct, () => {
  it("reconstructs a highlight from stored data", () => {
    const now = new Date();
    const data = {
      articleId: MOCK_ARTICLE_ID,
      color: "green",
      createdAt: now,
      endOffset: END,
      highlightedText: "text",
      id: MOCK_HIGHLIGHT_ID,
      note: "a note",
      prefixContext: "pre",
      startOffset: START,
      suffixContext: "suf",
      updatedAt: now,
    };

    const highlight = HighlightEntity.reconstruct(data);

    expect(highlight).toEqual(data);
  });
});
