import type { Article, ArticleRepository } from "../../domain/article/index.js";
import { ArticleEntity, ArticleIdVO } from "../../domain/article/index.js";
import { err, ok } from "neverthrow";
import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";
import { TagNameVO } from "../../domain/tag/index.js";

interface UpdateArticleDeps {
  readonly articleRepo: ArticleRepository;
}

interface UpdateArticleInput {
  readonly id: string;
  readonly memo?: string | null;
  readonly tags?: readonly string[];
  readonly isRead?: boolean;
}

const applyMemoUpdate = (article: Article, input: UpdateArticleInput): Article => {
  if (!("memo" in input)) {
    return article;
  }
  return ArticleEntity.updateMemo(article, input.memo ?? null);
};

const applyReadUpdate = (article: Article, input: UpdateArticleInput): Article => {
  if (!("isRead" in input)) {
    return article;
  }
  if (input.isRead === true) {
    return ArticleEntity.markAsRead(article);
  }
  return ArticleEntity.markAsUnread(article);
};

export const updateArticle =
  (deps: UpdateArticleDeps) =>
  (input: UpdateArticleInput): ResultAsync<Article, DomainError> =>
    ArticleIdVO.create(input.id)
      .asyncAndThen((id) =>
        deps.articleRepo.findById(id).andThen((article) => {
          if (article) {
            return ok(article);
          }
          return err({ id: input.id, type: "ARTICLE_NOT_FOUND" as const });
        }),
      )
      .andThen((article) => {
        let updated = applyMemoUpdate(article, input);
        updated = applyReadUpdate(updated, input);

        if ("tags" in input && input.tags) {
          const tagsResult = TagNameVO.validateMany(input.tags);
          if (tagsResult.isErr()) {
            return err(tagsResult.error);
          }
          updated = ArticleEntity.updateTags(updated, tagsResult.value);
        }

        return deps.articleRepo.save(updated);
      });
