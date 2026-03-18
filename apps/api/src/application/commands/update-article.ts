import { ok, err, type ResultAsync } from "neverthrow";
import {
  type ArticleRepository,
  ArticleIdVO,
  ArticleEntity,
  type Article,
} from "../../domain/article/index.js";
import { TagNameVO } from "../../domain/tag/index.js";
import type { DomainError } from "../../domain/shared/index.js";

type UpdateArticleDeps = {
  readonly articleRepo: ArticleRepository;
};

type UpdateArticleInput = {
  readonly id: string;
  readonly memo?: string | null;
  readonly tags?: readonly string[];
  readonly isRead?: boolean;
};

export const updateArticle =
  (deps: UpdateArticleDeps) =>
  (input: UpdateArticleInput): ResultAsync<Article, DomainError> =>
    ArticleIdVO.create(input.id)
      .asyncAndThen((id) =>
        deps.articleRepo
          .findById(id)
          .andThen((article) =>
            article ? ok(article) : err({ type: "ARTICLE_NOT_FOUND" as const, id: input.id }),
          ),
      )
      .andThen((article) => {
        let updated = article;

        if (input.memo !== undefined) {
          updated = ArticleEntity.updateMemo(updated, input.memo ?? null);
        }
        if (input.isRead !== undefined) {
          updated = input.isRead
            ? ArticleEntity.markAsRead(updated)
            : ArticleEntity.markAsUnread(updated);
        }
        if (input.tags !== undefined) {
          const tagsResult = TagNameVO.validateMany(input.tags);
          if (tagsResult.isErr()) return err(tagsResult.error);
          updated = ArticleEntity.updateTags(updated, tagsResult.value);
        }

        return deps.articleRepo.save(updated);
      });
