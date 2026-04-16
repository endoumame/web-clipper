import type { Highlight, HighlightRepository } from "../../domain/highlight/index.js";
import { HighlightEntity, HighlightId } from "../../domain/highlight/index.js";
import { err, ok } from "neverthrow";
import { ArticleId } from "../../domain/article/index.js";
import type { ArticleRepository } from "../../domain/article/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";

interface CreateHighlightDeps {
  readonly articleRepo: ArticleRepository;
  readonly highlightRepo: HighlightRepository;
}

interface CreateHighlightInput {
  readonly articleId: string;
  readonly highlightedText: string;
  readonly note?: string | null;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly prefixContext: string;
  readonly suffixContext: string;
  readonly color?: string;
}

const createHighlight = (
  deps: CreateHighlightDeps,
): ((input: CreateHighlightInput) => ResultAsync<Highlight, DomainError>) =>
  function executeCreateHighlight(
    input: CreateHighlightInput,
  ): ResultAsync<Highlight, DomainError> {
    return ArticleId.create(input.articleId)
      .asyncAndThen((articleId) =>
        deps.articleRepo.findById(articleId).andThen((article) => {
          if (!article) {
            return err({ id: input.articleId, type: "ARTICLE_NOT_FOUND" as const });
          }
          if (article.content === null || article.content === "") {
            return err({ articleId: input.articleId, type: "CONTENT_NOT_AVAILABLE" as const });
          }
          const highlight = HighlightEntity.create({
            articleId,
            color: input.color,
            endOffset: input.endOffset,
            highlightedText: input.highlightedText,
            id: HighlightId.generate(),
            note: input.note ?? null,
            prefixContext: input.prefixContext,
            startOffset: input.startOffset,
            suffixContext: input.suffixContext,
          });
          return ok(highlight);
        }),
      )
      .andThen((highlight) => deps.highlightRepo.save(highlight));
  };

export { createHighlight };
