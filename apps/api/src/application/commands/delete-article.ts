import { ok, err } from "neverthrow";
import type { ResultAsync } from "neverthrow";
import { type ArticleRepository, ArticleIdVO } from "../../domain/article/index.js";
import type { DomainError } from "../../domain/shared/index.js";

export const deleteArticle =
  (deps: { readonly articleRepo: ArticleRepository }) =>
  (id: string): ResultAsync<void, DomainError> =>
    ArticleIdVO.create(id)
      .asyncAndThen((articleId) =>
        deps.articleRepo
          .findById(articleId)
          .andThen((article) =>
            article ? ok(articleId) : err({ type: "ARTICLE_NOT_FOUND" as const, id }),
          ),
      )
      .andThen((articleId) => deps.articleRepo.delete(articleId));
