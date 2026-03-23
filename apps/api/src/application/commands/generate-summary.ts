import { err, ok, type ResultAsync } from "neverthrow";
import {
  type ArticleRepository,
  type ArticleSummarizer,
  type ContentExtractor,
  type Article,
  ArticleIdVO,
  ArticleEntity,
} from "../../domain/article/index.js";
import type { DomainError } from "../../domain/shared/index.js";

type GenerateSummaryDeps = {
  readonly articleRepo: ArticleRepository;
  readonly contentExtractor: ContentExtractor;
  readonly summarizer: ArticleSummarizer;
};

export const generateSummary =
  (deps: GenerateSummaryDeps) =>
  (id: string): ResultAsync<Article, DomainError> =>
    ArticleIdVO.create(id)
      .asyncAndThen((articleId) => deps.articleRepo.findById(articleId))
      .andThen((article) =>
        article ? ok(article) : err({ type: "ARTICLE_NOT_FOUND" as const, id }),
      )
      .andThen((article) =>
        deps.contentExtractor.extract(article.url).map((content) => ({ article, content })),
      )
      .andThen(({ article, content }) =>
        deps.summarizer
          .summarize(content)
          .map((summary) => ArticleEntity.updateAiSummary(article, summary)),
      )
      .andThen((article) => deps.articleRepo.save(article));
