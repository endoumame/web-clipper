import { err, ok, type ResultAsync } from "neverthrow";
import {
  type ArticleRepository,
  type MetadataFetcher,
  type ArticleSummarizer,
  type Article,
  ArticleIdVO,
  ArticleEntity,
} from "../../domain/article/index.js";
import type { DomainError } from "../../domain/shared/index.js";

type GenerateSummaryDeps = {
  readonly articleRepo: ArticleRepository;
  readonly metadataFetcher: MetadataFetcher;
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
        deps.metadataFetcher.fetch(article.url).map((metadata) => ({ article, metadata })),
      )
      .andThen(({ article, metadata }) => {
        const textContent = [metadata.title, metadata.description].filter(Boolean).join("\n\n");
        return deps.summarizer
          .summarize(textContent)
          .map((summary) => ArticleEntity.updateAiSummary(article, summary));
      })
      .andThen((article) => deps.articleRepo.save(article));
