import { err, ok } from "neverthrow";
import { ArticleIdVO } from "../../domain/article/index.js";
import type { ArticleRepository } from "../../domain/article/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";

const deleteArticle = (deps: {
  readonly articleRepo: ArticleRepository;
}): ((id: string) => ResultAsync<void, DomainError>) => {
  const executeDeleteArticle = (id: string): ResultAsync<void, DomainError> =>
    ArticleIdVO.create(id)
      .asyncAndThen((articleId) =>
        deps.articleRepo.findById(articleId).andThen((article) => {
          if (article) {
            return ok(articleId);
          }
          return err({ id, type: "ARTICLE_NOT_FOUND" as const });
        }),
      )
      .andThen((articleId) => deps.articleRepo.delete(articleId));
  return executeDeleteArticle;
};

export { deleteArticle };
