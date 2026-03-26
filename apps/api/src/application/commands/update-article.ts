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

const applyMemoUpdate = (article: Article, memo: string | null | undefined): Article => {
  // oxlint-disable-next-line no-undefined -- checking optional property presence requires undefined comparison
  if (memo === undefined) {
    return article;
  }
  return ArticleEntity.updateMemo(article, memo ?? null);
};

const applyReadUpdate = (article: Article, isRead: boolean | undefined): Article => {
  // oxlint-disable-next-line no-undefined -- checking optional property presence requires undefined comparison
  if (isRead === undefined) {
    return article;
  }
  if (isRead) {
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
        let updated = applyMemoUpdate(article, input.memo);
        updated = applyReadUpdate(updated, input.isRead);

        // oxlint-disable-next-line no-undefined -- checking optional property presence requires undefined comparison
        if (input.tags !== undefined) {
          const tagsResult = TagNameVO.validateMany(input.tags);
          if (tagsResult.isErr()) {
            return err(tagsResult.error);
          }
          updated = ArticleEntity.updateTags(updated, tagsResult.value);
        }

        return deps.articleRepo.save(updated);
      });
