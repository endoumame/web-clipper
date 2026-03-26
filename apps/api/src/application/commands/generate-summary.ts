import type {
  Article,
  ArticleRepository,
  ArticleSummarizer,
  ContentExtractor,
} from "../../domain/article/index.js";
import { ArticleEntity, ArticleIdVO } from "../../domain/article/index.js";
import { err, ok } from "neverthrow";
import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";

interface GenerateSummaryDeps {
  readonly articleRepo: ArticleRepository;
  readonly contentExtractor: ContentExtractor;
  readonly summarizer: ArticleSummarizer;
}

const generateSummary = (
  deps: GenerateSummaryDeps,
): ((id: string) => ResultAsync<Article, DomainError>) =>
  function executeGenerateSummary(id: string): ResultAsync<Article, DomainError> {
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
        deps.summarizer
          .summarize(content)
          .map((summary) => ArticleEntity.updateAiSummary(article, summary)),
      )
      .andThen((article) => deps.articleRepo.save(article));
  };

export { generateSummary };
