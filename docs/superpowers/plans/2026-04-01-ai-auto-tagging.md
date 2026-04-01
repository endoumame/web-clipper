# AI Auto-Tagging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically suggest and apply tags to articles using Cloudflare Workers AI when a new article is clipped, running asynchronously via `ctx.executionCtx.waitUntil()`.

**Architecture:** Add a `TagSuggester` domain service interface with a `WorkersAiTagSuggester` infrastructure implementation, following the existing `ArticleSummarizer` / `WorkersAiSummarizer` pattern. A new `suggestAndApplyTags` command orchestrates the flow. The `createArticleRoute` handler fires it asynchronously after `clipArticle` succeeds.

**Tech Stack:** TypeScript, Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct-fp8`), neverthrow, Zod, Vitest with `@cloudflare/vitest-pool-workers`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `apps/api/src/domain/tag/tag-suggester.ts` | `TagSuggester` interface + `TagSuggestionInput` type |
| Modify | `apps/api/src/domain/tag/index.ts` | Re-export `TagSuggester` type |
| Modify | `apps/api/src/domain/shared/errors.ts` | Add `TAG_SUGGESTION_FAILED` variant |
| Modify | `apps/api/src/presentation/middleware/error-handler.ts` | Add `TAG_SUGGESTION_FAILED` to `STATUS_MAP` and switch cases |
| Create | `apps/api/src/application/commands/suggest-and-apply-tags.ts` | `suggestAndApplyTags` command |
| Modify | `apps/api/src/application/commands/index.ts` | Re-export new command |
| Create | `apps/api/src/infrastructure/services/workers-ai-tag-suggester.ts` | `WorkersAiTagSuggester` implementation |
| Modify | `apps/api/src/infrastructure/deps-factory.ts` | Wire `tagSuggester` |
| Modify | `apps/api/src/presentation/types.ts` | Add `tagSuggester` to `Deps` |
| Modify | `apps/api/src/presentation/routes/articles.ts` | Add `waitUntil` call in `createArticleRoute` |
| Create | `apps/api/src/domain/tag/tag-suggester.test.ts` | Unit test for `TagSuggestionInput` construction |
| Create | `apps/api/src/application/commands/suggest-and-apply-tags.test.ts` | Unit test for the command |
| Create | `apps/api/src/infrastructure/services/workers-ai-tag-suggester.test.ts` | Unit test for JSON parsing logic |

---

### Task 1: Add `TAG_SUGGESTION_FAILED` to DomainError

**Files:**
- Modify: `apps/api/src/domain/shared/errors.ts:22`
- Modify: `apps/api/src/presentation/middleware/error-handler.ts:4-21,29-61,71-103`

- [ ] **Step 1: Add the new error variant to `DomainError`**

In `apps/api/src/domain/shared/errors.ts`, add the new variant before the closing semicolon:

```typescript
  | { readonly type: "SUMMARY_GENERATION_FAILED"; readonly cause: string }
  | { readonly type: "TAG_SUGGESTION_FAILED"; readonly cause: string };
```

- [ ] **Step 2: Add `TAG_SUGGESTION_FAILED` to `STATUS_MAP` in `error-handler.ts`**

In `apps/api/src/presentation/middleware/error-handler.ts`, add to `STATUS_MAP`:

```typescript
  TAG_ALREADY_EXISTS: 409,
  TAG_NOT_FOUND: 404,
  TAG_SUGGESTION_FAILED: 502,
} as const satisfies Record<DomainError["type"], number>;
```

- [ ] **Step 3: Add `TAG_SUGGESTION_FAILED` to the switch cases in `error-handler.ts`**

In `toMessageWithCause`, add `"TAG_SUGGESTION_FAILED"` to the group that returns `""`:

```typescript
    case "SUMMARY_GENERATION_FAILED":
    case "TAG_SUGGESTION_FAILED": {
      return "";
    }
```

In `toMessageForErrorTypes`, add a case for `TAG_SUGGESTION_FAILED`:

```typescript
    case "SUMMARY_GENERATION_FAILED": {
      return `AI summary generation failed: ${error.cause}`;
    }
    case "TAG_SUGGESTION_FAILED": {
      return `AI tag suggestion failed: ${error.cause}`;
    }
```

- [ ] **Step 4: Run typecheck to verify**

Run: `cd apps/api && pnpm typecheck`
Expected: No errors. The `satisfies Record<DomainError["type"], number>` ensures exhaustiveness.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/domain/shared/errors.ts apps/api/src/presentation/middleware/error-handler.ts
git commit -m "feat: add TAG_SUGGESTION_FAILED to DomainError"
```

---

### Task 2: Create `TagSuggester` domain service interface

**Files:**
- Create: `apps/api/src/domain/tag/tag-suggester.ts`
- Modify: `apps/api/src/domain/tag/index.ts`

- [ ] **Step 1: Create the interface file**

Create `apps/api/src/domain/tag/tag-suggester.ts`:

```typescript
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
```

- [ ] **Step 2: Re-export from the barrel file**

In `apps/api/src/domain/tag/index.ts`, add:

```typescript
export type { TagSuggester, TagSuggestionInput } from "./tag-suggester.js";
```

- [ ] **Step 3: Run typecheck to verify**

Run: `cd apps/api && pnpm typecheck`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/domain/tag/tag-suggester.ts apps/api/src/domain/tag/index.ts
git commit -m "feat: add TagSuggester domain service interface"
```

---

### Task 3: Create `WorkersAiTagSuggester` infrastructure implementation

**Files:**
- Create: `apps/api/src/infrastructure/services/workers-ai-tag-suggester.ts`
- Create: `apps/api/src/infrastructure/services/workers-ai-tag-suggester.test.ts`

- [ ] **Step 1: Write the failing test for JSON parsing logic**

Create `apps/api/src/infrastructure/services/workers-ai-tag-suggester.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { parseTagSuggestions } from "./workers-ai-tag-suggester.js";

describe("parseTagSuggestions", () => {
  it("parses a valid JSON array of tag names", () => {
    const result = parseTagSuggestions('["TypeScript", "React", "Frontend"]');
    expect(result).toEqual(["TypeScript", "React", "Frontend"]);
  });

  it("extracts JSON array from surrounding text", () => {
    const result = parseTagSuggestions('Here are the tags: ["TypeScript", "React"]');
    expect(result).toEqual(["TypeScript", "React"]);
  });

  it("skips invalid tag names (empty strings, too long)", () => {
    const tooLong = "a".repeat(51);
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && pnpm vitest run src/infrastructure/services/workers-ai-tag-suggester.test.ts`
Expected: FAIL — `parseTagSuggestions` does not exist yet.

- [ ] **Step 3: Write the implementation**

Create `apps/api/src/infrastructure/services/workers-ai-tag-suggester.ts`:

```typescript
import type { TagSuggester, TagSuggestionInput } from "../../domain/tag/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import type { TagName } from "../../domain/tag/index.js";
import { ResultAsync } from "neverthrow";
import { TagNameVO } from "../../domain/tag/index.js";

const TRUNCATE_START = 0;
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
  const truncated = input.content.slice(TRUNCATE_START, MAX_TEXT_LENGTH);
  const existingTagNames = input.existingTags.join(", ");
  return [
    `Title: ${input.title}`,
    `Description: ${input.description ?? "(none)"}`,
    `Existing tags in the system: [${existingTagNames}]`,
    `Article content:\n${truncated}`,
  ].join("\n\n");
};

const parseTagSuggestions = (raw: string): string[] => {
  const match = /\[[\s\S]*\]/.exec(raw);
  if (!match) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  const validated: string[] = [];
  for (const item of parsed) {
    if (typeof item !== "string") {
      continue;
    }
    const result = TagNameVO.create(item);
    if (result.isOk()) {
      validated.push(result.value);
    }
  }
  return validated;
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
          return tags.slice(0, MAX_TAGS) as TagName[];
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && pnpm vitest run src/infrastructure/services/workers-ai-tag-suggester.test.ts`
Expected: All 6 tests PASS.

- [ ] **Step 5: Run full typecheck**

Run: `cd apps/api && pnpm typecheck`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/infrastructure/services/workers-ai-tag-suggester.ts apps/api/src/infrastructure/services/workers-ai-tag-suggester.test.ts
git commit -m "feat: add WorkersAiTagSuggester with JSON parsing and tests"
```

---

### Task 4: Create `suggestAndApplyTags` command

**Files:**
- Create: `apps/api/src/application/commands/suggest-and-apply-tags.ts`
- Modify: `apps/api/src/application/commands/index.ts`
- Create: `apps/api/src/application/commands/suggest-and-apply-tags.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/application/commands/suggest-and-apply-tags.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { suggestAndApplyTags } from "./suggest-and-apply-tags.js";
import { errAsync, okAsync } from "neverthrow";
import type { Article } from "../../domain/article/index.js";
import type { TagName } from "../../domain/tag/index.js";

const createMockArticle = (tags: readonly string[]): Article =>
  ({
    id: "article-1",
    url: "https://example.com",
    title: "Test Article",
    description: "A test article",
    source: "other",
    ogImageUrl: null,
    memo: null,
    aiSummary: null,
    isRead: false,
    tags: tags as unknown as readonly TagName[],
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as Article;

describe("suggestAndApplyTags", () => {
  it("merges AI-suggested tags with existing article tags", async () => {
    const article = createMockArticle(["existing-tag"]);
    const savedArticle = { ...article };
    const deps = {
      articleRepo: {
        findById: vi.fn().mockReturnValue(okAsync(article)),
        findByUrl: vi.fn(),
        save: vi.fn().mockReturnValue(okAsync(savedArticle)),
        delete: vi.fn(),
      },
      contentExtractor: {
        extract: vi.fn().mockReturnValue(okAsync("Article content here")),
      },
      tagSuggester: {
        suggest: vi.fn().mockReturnValue(okAsync(["existing-tag", "new-tag"] as unknown as readonly TagName[])),
      },
      tagQuery: {
        list: vi.fn().mockResolvedValue([
          { id: "1", name: "existing-tag", createdAt: new Date(), articleCount: 5 },
        ]),
      },
    };

    const result = await suggestAndApplyTags(deps)("article-1");

    expect(result.isOk()).toBe(true);
    const saveCall = deps.articleRepo.save.mock.calls[0][0] as Article;
    const savedTags = [...saveCall.tags] as string[];
    expect(savedTags).toContain("existing-tag");
    expect(savedTags).toContain("new-tag");
    expect(new Set(savedTags).size).toBe(savedTags.length);
  });

  it("returns ok even when article has no existing tags", async () => {
    const article = createMockArticle([]);
    const deps = {
      articleRepo: {
        findById: vi.fn().mockReturnValue(okAsync(article)),
        findByUrl: vi.fn(),
        save: vi.fn().mockReturnValue(okAsync(article)),
        delete: vi.fn(),
      },
      contentExtractor: {
        extract: vi.fn().mockReturnValue(okAsync("Content")),
      },
      tagSuggester: {
        suggest: vi.fn().mockReturnValue(okAsync(["suggested-tag"] as unknown as readonly TagName[])),
      },
      tagQuery: {
        list: vi.fn().mockResolvedValue([]),
      },
    };

    const result = await suggestAndApplyTags(deps)("article-1");

    expect(result.isOk()).toBe(true);
    const saveCall = deps.articleRepo.save.mock.calls[0][0] as Article;
    expect([...saveCall.tags]).toEqual(["suggested-tag"]);
  });

  it("returns error when article is not found", async () => {
    const deps = {
      articleRepo: {
        findById: vi.fn().mockReturnValue(okAsync(null)),
        findByUrl: vi.fn(),
        save: vi.fn(),
        delete: vi.fn(),
      },
      contentExtractor: {
        extract: vi.fn(),
      },
      tagSuggester: {
        suggest: vi.fn(),
      },
      tagQuery: {
        list: vi.fn(),
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
        findById: vi.fn().mockReturnValue(okAsync(article)),
        findByUrl: vi.fn(),
        save: vi.fn(),
        delete: vi.fn(),
      },
      contentExtractor: {
        extract: vi.fn().mockReturnValue(
          errAsync({ type: "METADATA_FETCH_FAILED" as const, url: "https://example.com", cause: "timeout" }),
        ),
      },
      tagSuggester: {
        suggest: vi.fn(),
      },
      tagQuery: {
        list: vi.fn(),
      },
    };

    const result = await suggestAndApplyTags(deps)("article-1");

    expect(result.isErr()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && pnpm vitest run src/application/commands/suggest-and-apply-tags.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the command implementation**

Create `apps/api/src/application/commands/suggest-and-apply-tags.ts`:

```typescript
import type { Article, ArticleRepository, ContentExtractor } from "../../domain/article/index.js";
import { ArticleEntity, ArticleIdVO } from "../../domain/article/index.js";
import { ResultAsync, err, ok } from "neverthrow";
import type { DomainError } from "../../domain/shared/index.js";
import type { TagName, TagSuggester } from "../../domain/tag/index.js";
import type { TagQueryService } from "../../application/queries/tag-query-service.js";
import { TagNameVO } from "../../domain/tag/index.js";

interface SuggestAndApplyTagsDeps {
  readonly articleRepo: ArticleRepository;
  readonly contentExtractor: ContentExtractor;
  readonly tagSuggester: TagSuggester;
  readonly tagQuery: TagQueryService;
}

const TRUNCATE_START = 0;
const MAX_TEXT_LENGTH = 6000;

const mergeTags = (existing: readonly TagName[], suggested: readonly TagName[]): readonly TagName[] => {
  const seen = new Set<string>(existing.map(String));
  const merged: TagName[] = [...existing];
  for (const tag of suggested) {
    if (!seen.has(String(tag))) {
      seen.add(String(tag));
      merged.push(tag);
    }
  }
  return merged;
};

const suggestAndApplyTags = (
  deps: SuggestAndApplyTagsDeps,
): ((id: string) => ResultAsync<Article, DomainError>) =>
  function executeSuggestAndApplyTags(id: string): ResultAsync<Article, DomainError> {
    return ArticleIdVO.create(id)
      .asyncAndThen((articleId) => deps.articleRepo.findById(articleId))
      .andThen((article) => {
        if (article) {
          return ok(article);
        }
        return err({ id, type: "ARTICLE_NOT_FOUND" as const });
      })
      .andThen((article) =>
        deps.contentExtractor.extract(article.url).map((content) => ({
          article,
          content: content.slice(TRUNCATE_START, MAX_TEXT_LENGTH),
        })),
      )
      .andThen(({ article, content }) =>
        ResultAsync.fromSafePromise(deps.tagQuery.list()).map((allTags) => {
          const existingTagNames = allTags
            .map((t) => TagNameVO.create(t.name))
            .filter((r) => r.isOk())
            .map((r) => r.value);
          return { article, content, existingTagNames };
        }),
      )
      .andThen(({ article, content, existingTagNames }) =>
        deps.tagSuggester
          .suggest({
            content,
            description: article.description,
            existingTags: existingTagNames,
            title: article.title,
          })
          .map((suggestedTags) => {
            const mergedTags = mergeTags(article.tags, suggestedTags);
            return ArticleEntity.updateTags(article, mergedTags);
          }),
      )
      .andThen((article) => deps.articleRepo.save(article));
  };

export { suggestAndApplyTags };
```

- [ ] **Step 4: Re-export from index**

In `apps/api/src/application/commands/index.ts`, add:

```typescript
export { suggestAndApplyTags } from "./suggest-and-apply-tags.js";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/api && pnpm vitest run src/application/commands/suggest-and-apply-tags.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 6: Run full typecheck**

Run: `cd apps/api && pnpm typecheck`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/application/commands/suggest-and-apply-tags.ts apps/api/src/application/commands/suggest-and-apply-tags.test.ts apps/api/src/application/commands/index.ts
git commit -m "feat: add suggestAndApplyTags command with tests"
```

---

### Task 5: Wire up DI and integrate into `createArticleRoute`

**Files:**
- Modify: `apps/api/src/presentation/types.ts:1-6,15-28`
- Modify: `apps/api/src/infrastructure/deps-factory.ts:1-13,16-32`
- Modify: `apps/api/src/presentation/routes/articles.ts:1-8,107-124`

- [ ] **Step 1: Add `tagSuggester` to `Deps` type**

In `apps/api/src/presentation/types.ts`, add the import and property:

```typescript
import type { TagRepository, TagSuggester } from "../domain/tag/index.js";
```

Add to the `Deps` interface:

```typescript
  readonly tagRepo: TagRepository;
  readonly tagSuggester: TagSuggester;
  readonly userRepo: UserRepository;
```

- [ ] **Step 2: Wire `tagSuggester` in `deps-factory.ts`**

In `apps/api/src/infrastructure/deps-factory.ts`, add the import:

```typescript
import { createWorkersAiTagSuggester } from "./services/workers-ai-tag-suggester.js";
```

Add to the return object (between `tagQuery` and `tagRepo`):

```typescript
    tagRepo: createD1TagRepository(db),
    tagSuggester: createWorkersAiTagSuggester(env.AI),
    userRepo: createD1UserRepository(db),
```

- [ ] **Step 3: Add `waitUntil` to `createArticleRoute` handler**

In `apps/api/src/presentation/routes/articles.ts`, add the import:

```typescript
import {
  clipArticle,
  deleteArticle,
  generateSummary,
  suggestAndApplyTags,
  updateArticle,
} from "../../application/commands/index.js";
```

Replace the `createArticleRoute` handler (lines 107-124):

```typescript
  .openapi(createArticleRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const body = ctx.req.valid("json");
    const result = await clipArticle({
      articleRepo: deps.articleRepo,
      metadataFetcher: deps.metadataFetcher,
    })({ memo: body.memo, tags: body.tags, url: body.url });
    return result.match(
      (article) => {
        ctx.executionCtx.waitUntil(
          suggestAndApplyTags({
            articleRepo: deps.articleRepo,
            contentExtractor: deps.contentExtractor,
            tagQuery: deps.tagQuery,
            tagSuggester: deps.tagSuggester,
          })(article.id).match(
            () => {},
            (error) => {
              console.error("Auto-tagging failed:", error);
            },
          ),
        );
        return ctx.json(toArticleResponse(article), HTTP_CREATED);
      },
      (error) =>
        ctx.json(
          domainErrorToResponse(error),
          domainErrorToStatus<
            typeof HTTP_BAD_REQUEST | typeof HTTP_CONFLICT | typeof HTTP_BAD_GATEWAY
          >(error),
        ),
    );
  })
```

- [ ] **Step 4: Run typecheck**

Run: `cd apps/api && pnpm typecheck`
Expected: No errors.

- [ ] **Step 5: Run all tests**

Run: `cd apps/api && pnpm test`
Expected: All tests pass.

- [ ] **Step 6: Run lint**

Run: `pnpm --filter @web-clipper/api exec oxlint --type-aware .`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/presentation/types.ts apps/api/src/infrastructure/deps-factory.ts apps/api/src/presentation/routes/articles.ts
git commit -m "feat: integrate AI auto-tagging into article creation flow"
```
