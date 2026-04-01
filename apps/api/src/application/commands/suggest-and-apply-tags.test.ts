// oxlint-disable typescript/no-unsafe-call, typescript/no-unsafe-member-access, typescript/no-unsafe-assignment, typescript/no-unsafe-argument, typescript/no-unsafe-type-assertion, typescript/strict-boolean-expressions, max-lines-per-function, vitest/prefer-to-be-truthy, vitest/prefer-strict-boolean-matchers -- test file uses vitest globals and intentional mock type casts
import { errAsync, okAsync } from "neverthrow";

import type { Article } from "../../domain/article/index.js";
import type { TagName } from "../../domain/tag/index.js";
import { suggestAndApplyTags } from "./suggest-and-apply-tags.js";

const createMockArticle = (tags: readonly string[]): Article =>
  ({
    aiSummary: null,
    createdAt: new Date(),
    description: "A test article",
    id: "article-1",
    isRead: false,
    memo: null,
    ogImageUrl: null,
    source: "other",
    tags: tags as unknown as readonly TagName[],
    title: "Test Article",
    updatedAt: new Date(),
    url: "https://example.com",
  }) as Article;

const FIRST_CALL = 0;
const FIRST_ARG = 0;

describe(suggestAndApplyTags, () => {
  it("merges AI-suggested tags with existing article tags", async () => {
    const article = createMockArticle(["existing-tag"]);
    const savedArticle = { ...article };
    const deps = {
      articleRepo: {
        delete: vi.fn(),
        findById: vi.fn().mockReturnValue(okAsync(article)),
        findByUrl: vi.fn(),
        save: vi.fn().mockReturnValue(okAsync(savedArticle)),
      },
      contentExtractor: {
        extract: vi.fn().mockReturnValue(okAsync("Article content here")),
      },
      tagQuery: {
        list: vi
          .fn()
          .mockResolvedValue([
            { articleCount: 5, createdAt: new Date(), id: "1", name: "existing-tag" },
          ]),
      },
      tagSuggester: {
        suggest: vi
          .fn()
          .mockReturnValue(okAsync(["existing-tag", "new-tag"] as unknown as readonly TagName[])),
      },
    };

    const result = await suggestAndApplyTags(deps)("article-1");

    expect(result.isOk()).toBeTruthy();
    const saveCall = deps.articleRepo.save.mock.calls[FIRST_CALL][FIRST_ARG] as Article;
    const savedTags = [...saveCall.tags] as string[];
    expect(savedTags).toContain("existing-tag");
    expect(savedTags).toContain("new-tag");
    expect(new Set(savedTags).size).toBe(savedTags.length);
  });

  it("returns ok even when article has no existing tags", async () => {
    const article = createMockArticle([]);
    const deps = {
      articleRepo: {
        delete: vi.fn(),
        findById: vi.fn().mockReturnValue(okAsync(article)),
        findByUrl: vi.fn(),
        save: vi.fn().mockReturnValue(okAsync(article)),
      },
      contentExtractor: {
        extract: vi.fn().mockReturnValue(okAsync("Content")),
      },
      tagQuery: {
        list: vi.fn().mockResolvedValue([]),
      },
      tagSuggester: {
        suggest: vi
          .fn()
          .mockReturnValue(okAsync(["suggested-tag"] as unknown as readonly TagName[])),
      },
    };

    const result = await suggestAndApplyTags(deps)("article-1");

    expect(result.isOk()).toBe(true);
    const saveCall = deps.articleRepo.save.mock.calls[FIRST_CALL][FIRST_ARG] as Article;
    expect([...saveCall.tags]).toEqual(["suggested-tag"]);
  });

  it("returns error when article is not found", async () => {
    const deps = {
      articleRepo: {
        delete: vi.fn(),
        findById: vi.fn().mockReturnValue(okAsync(null)),
        findByUrl: vi.fn(),
        save: vi.fn(),
      },
      contentExtractor: {
        extract: vi.fn(),
      },
      tagQuery: {
        list: vi.fn(),
      },
      tagSuggester: {
        suggest: vi.fn(),
      },
    };

    const result = await suggestAndApplyTags(deps)("article-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("ARTICLE_NOT_FOUND");
    }
  });

  it("returns error when content extraction fails", async () => {
    const article = createMockArticle([]);
    const deps = {
      articleRepo: {
        delete: vi.fn(),
        findById: vi.fn().mockReturnValue(okAsync(article)),
        findByUrl: vi.fn(),
        save: vi.fn(),
      },
      contentExtractor: {
        extract: vi.fn().mockReturnValue(
          errAsync({
            cause: "timeout",
            type: "METADATA_FETCH_FAILED" as const,
            url: "https://example.com",
          }),
        ),
      },
      tagQuery: {
        list: vi.fn(),
      },
      tagSuggester: {
        suggest: vi.fn(),
      },
    };

    const result = await suggestAndApplyTags(deps)("article-1");

    expect(result.isErr()).toBe(true);
  });
});
