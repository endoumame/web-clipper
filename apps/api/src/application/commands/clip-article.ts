import { ok, err, type ResultAsync } from "neverthrow";
import {
  type ArticleRepository,
  type MetadataFetcher,
  ArticleIdVO,
  ArticleUrlVO,
  SourceVO,
  ArticleEntity,
  type Article,
} from "../../domain/article/index.js";
import { TagNameVO } from "../../domain/tag/index.js";
import type { DomainError } from "../../domain/shared/index.js";

type ClipArticleDeps = {
  readonly articleRepo: ArticleRepository;
  readonly metadataFetcher: MetadataFetcher;
};

type ClipArticleInput = {
  readonly url: string;
  readonly tags: readonly string[];
  readonly memo?: string;
};

export const clipArticle =
  (deps: ClipArticleDeps) =>
  (input: ClipArticleInput): ResultAsync<Article, DomainError> =>
    ArticleUrlVO.create(input.url)
      .asyncAndThen((url) =>
        deps.articleRepo
          .findByUrl(url)
          .andThen((existing) =>
            existing ? err({ type: "ARTICLE_ALREADY_EXISTS" as const, url: input.url }) : ok(url),
          ),
      )
      .andThen((url) => deps.metadataFetcher.fetch(url).map((metadata) => ({ url, metadata })))
      .andThen(({ url, metadata }) => {
        const tagsResult = TagNameVO.validateMany(input.tags);
        if (tagsResult.isErr()) return err(tagsResult.error);

        const article = ArticleEntity.create({
          id: ArticleIdVO.generate(),
          url,
          title: metadata.title,
          description: metadata.description,
          source: SourceVO.fromUrl(input.url),
          ogImageUrl: metadata.ogImageUrl,
          memo: input.memo ?? null,
          tags: tagsResult.value,
        });

        return ok(article);
      })
      .andThen((article) => deps.articleRepo.save(article));
