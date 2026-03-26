import type { Article, ArticleRepository, MetadataFetcher } from "../../domain/article/index.js";
import { ArticleEntity, ArticleIdVO, ArticleUrlVO, SourceVO } from "../../domain/article/index.js";
import { err, ok } from "neverthrow";
import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";
import { TagNameVO } from "../../domain/tag/index.js";

interface ClipArticleDeps {
  readonly articleRepo: ArticleRepository;
  readonly metadataFetcher: MetadataFetcher;
}

interface ClipArticleInput {
  readonly url: string;
  readonly tags: readonly string[];
  readonly memo?: string;
}

const clipArticle = (
  deps: ClipArticleDeps,
): ((input: ClipArticleInput) => ResultAsync<Article, DomainError>) =>
  function executeClipArticle(input: ClipArticleInput): ResultAsync<Article, DomainError> {
    return ArticleUrlVO.create(input.url)
      .asyncAndThen((url) =>
        deps.articleRepo.findByUrl(url).andThen((existing) => {
          if (existing) {
            return err({ type: "ARTICLE_ALREADY_EXISTS" as const, url: input.url });
          }
          return ok(url);
        }),
      )
      .andThen((url) => deps.metadataFetcher.fetch(url).map((metadata) => ({ metadata, url })))
      .andThen(({ url, metadata }) => {
        const tagsResult = TagNameVO.validateMany(input.tags);
        if (tagsResult.isErr()) {
          return err(tagsResult.error);
        }

        const article = ArticleEntity.create({
          description: metadata.description,
          id: ArticleIdVO.generate(),
          memo: input.memo ?? null,
          ogImageUrl: metadata.ogImageUrl,
          source: SourceVO.fromUrl(input.url),
          tags: tagsResult.value,
          title: metadata.title,
          url,
        });

        return ok(article);
      })
      .andThen((article) => deps.articleRepo.save(article));
  };

export { clipArticle };
