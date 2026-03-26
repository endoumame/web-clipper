import type { HTTP_BAD_GATEWAY, HTTP_BAD_REQUEST, HTTP_CONFLICT } from "../http-status.js";
import { HTTP_CREATED, HTTP_NOT_FOUND, HTTP_NO_CONTENT, HTTP_OK } from "../http-status.js";
import {
  clipArticle,
  deleteArticle,
  generateSummary,
  updateArticle,
} from "../../application/commands/index.js";
import {
  createArticleRoute,
  deleteArticleRoute,
  generateSummaryRoute,
  getArticleRoute,
  listArticlesRoute,
  updateArticleRoute,
} from "./article-route-defs.js";
import { domainErrorToResponse, domainErrorToStatus } from "../middleware/error-handler.js";
import type { AppEnv } from "../types.js";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Source } from "../../domain/article/source.js";
import { SourceSchema } from "@web-clipper/shared";

interface ArticleInput {
  aiSummary: string | null;
  createdAt: Date;
  description: string | null;
  id: string;
  isRead: boolean;
  memo: string | null;
  ogImageUrl: string | null;
  source: Source;
  tags: readonly string[];
  title: string;
  updatedAt: Date;
  url: string;
}

const toArticleResponse = (
  article: ArticleInput,
): {
  aiSummary: string | null;
  createdAt: string;
  description: string | null;
  id: string;
  isRead: boolean;
  memo: string | null;
  ogImageUrl: string | null;
  source: Source;
  tags: string[];
  title: string;
  updatedAt: string;
  url: string;
} => ({
  aiSummary: article.aiSummary,
  createdAt: article.createdAt.toISOString(),
  description: article.description,
  id: article.id,
  isRead: article.isRead,
  memo: article.memo,
  ogImageUrl: article.ogImageUrl,
  source: SourceSchema.parse(article.source),
  tags: [...article.tags],
  title: article.title,
  updatedAt: article.updatedAt.toISOString(),
  url: article.url,
});

const articleRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listArticlesRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const query = ctx.req.valid("query");
    const result = await deps.articleQuery.list({
      cursor: query.cursor,
      isRead: query.isRead,
      limit: query.limit,
      search: query.search,
      source: query.source,
      tagName: query.tagId,
    });
    return ctx.json(
      {
        articles: result.articles.map((item) => ({
          ...item,
          aiSummary: null,
          createdAt: item.createdAt.toISOString(),
          description: item.description ?? null,
          memo: null,
          ogImageUrl: item.ogImageUrl ?? null,
          source: SourceSchema.parse(item.source),
          tags: [],
          updatedAt: item.createdAt.toISOString(),
        })),
        nextCursor: result.nextCursor,
      },
      HTTP_OK,
    );
  })
  .openapi(getArticleRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const { id } = ctx.req.valid("param");
    const article = await deps.articleQuery.getById(id);
    if (!article) {
      return ctx.json({ error: "ARTICLE_NOT_FOUND", message: `Not found: ${id}` }, HTTP_NOT_FOUND);
    }
    return ctx.json(toArticleResponse(article), HTTP_OK);
  })
  .openapi(createArticleRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const body = ctx.req.valid("json");
    const result = await clipArticle({
      articleRepo: deps.articleRepo,
      metadataFetcher: deps.metadataFetcher,
    })({ memo: body.memo, tags: body.tags, url: body.url });
    return result.match(
      (article) => ctx.json(toArticleResponse(article), HTTP_CREATED),
      (error) =>
        ctx.json(
          domainErrorToResponse(error),
          domainErrorToStatus<
            typeof HTTP_BAD_REQUEST | typeof HTTP_CONFLICT | typeof HTTP_BAD_GATEWAY
          >(error),
        ),
    );
  })
  .openapi(updateArticleRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const { id } = ctx.req.valid("param");
    const body = ctx.req.valid("json");
    const result = await updateArticle({
      articleRepo: deps.articleRepo,
    })({ id, ...body });
    return result.match(
      (article) => ctx.json(toArticleResponse(article), HTTP_OK),
      (error) =>
        ctx.json(
          domainErrorToResponse(error),
          domainErrorToStatus<typeof HTTP_BAD_REQUEST | typeof HTTP_NOT_FOUND>(error),
        ),
    );
  })
  .openapi(generateSummaryRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const { id } = ctx.req.valid("param");
    const result = await generateSummary({
      articleRepo: deps.articleRepo,
      contentExtractor: deps.contentExtractor,
      summarizer: deps.summarizer,
    })(id);
    return result.match(
      (article) => ctx.json(toArticleResponse(article), HTTP_OK),
      (error) =>
        ctx.json(
          domainErrorToResponse(error),
          domainErrorToStatus<typeof HTTP_NOT_FOUND | typeof HTTP_BAD_GATEWAY>(error),
        ),
    );
  })
  .openapi(deleteArticleRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const { id } = ctx.req.valid("param");
    const result = await deleteArticle({
      articleRepo: deps.articleRepo,
    })(id);
    return result.match(
      () => ctx.body(null, HTTP_NO_CONTENT),
      (error) =>
        ctx.json(domainErrorToResponse(error), domainErrorToStatus<typeof HTTP_NOT_FOUND>(error)),
    );
  });

export { articleRoutes };
