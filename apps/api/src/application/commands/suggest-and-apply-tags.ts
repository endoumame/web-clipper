import type { Article, ArticleRepository, ContentExtractor } from "../../domain/article/index.js";
import { ArticleEntity, ArticleIdVO } from "../../domain/article/index.js";
import { ResultAsync, err, ok } from "neverthrow";
import type { TagName, TagSuggester } from "../../domain/tag/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import { TagNameVO } from "../../domain/tag/index.js";
import type { TagQueryService } from "../../application/queries/tag-query-service.js";

interface SuggestAndApplyTagsDeps {
  readonly articleRepo: ArticleRepository;
  readonly contentExtractor: ContentExtractor;
  readonly tagSuggester: TagSuggester;
  readonly tagQuery: TagQueryService;
}

const mergeTags = (
  existing: readonly TagName[],
  suggested: readonly TagName[],
): readonly TagName[] => {
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
        deps.contentExtractor.extract(article.url).map((content) => ({ article, content })),
      )
      .andThen(({ article, content }) =>
        ResultAsync.fromSafePromise(deps.tagQuery.list()).map((allTags) => {
          const systemTagNames = allTags
            .map((tag) => TagNameVO.create(tag.name))
            .filter((result) => result.isOk())
            .map((result) => result.value);
          return { article, content, systemTagNames };
        }),
      )
      .andThen(({ article, content, systemTagNames }) =>
        deps.tagSuggester
          .suggest({
            content,
            description: article.description,
            existingTags: systemTagNames,
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
