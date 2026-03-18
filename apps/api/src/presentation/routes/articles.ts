import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  CreateArticleInputSchema,
  UpdateArticleInputSchema,
  ArticleResponseSchema,
  ArticleListResponseSchema,
  ArticleQueryParamsSchema,
  ErrorResponseSchema,
  SourceSchema,
} from "@web-clipper/shared";
import type { AppEnv } from "../types.js";
import { domainErrorToResponse, domainErrorToStatus } from "../middleware/error-handler.js";
import { clipArticle, updateArticle, deleteArticle } from "../../application/commands/index.js";

const toArticleResponse = (article: {
  id: string;
  url: string;
  title: string;
  description: string | null;
  source: string;
  ogImageUrl: string | null;
  memo: string | null;
  isRead: boolean;
  tags: readonly string[];
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: article.id,
  url: article.url,
  title: article.title,
  description: article.description,
  source: SourceSchema.parse(article.source),
  ogImageUrl: article.ogImageUrl,
  memo: article.memo,
  isRead: article.isRead,
  tags: [...article.tags],
  createdAt: article.createdAt.toISOString(),
  updatedAt: article.updatedAt.toISOString(),
});

// --- Route definitions ---

const listArticlesRoute = createRoute({
  method: "get",
  path: "/api/articles",
  tags: ["Articles"],
  summary: "List articles",
  request: {
    query: ArticleQueryParamsSchema.openapi("ArticleQueryParams"),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ArticleListResponseSchema.openapi("ArticleListResponse"),
        },
      },
      description: "List of articles",
    },
  },
});

const getArticleRoute = createRoute({
  method: "get",
  path: "/api/articles/{id}",
  tags: ["Articles"],
  summary: "Get article detail",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "Article ID" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ArticleResponseSchema.openapi("ArticleResponse"),
        },
      },
      description: "Article detail",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema.openapi("ErrorResponse"),
        },
      },
      description: "Article not found",
    },
  },
});

const createArticleRoute = createRoute({
  method: "post",
  path: "/api/articles",
  tags: ["Articles"],
  summary: "Clip a new article",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateArticleInputSchema.openapi("CreateArticleInput"),
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: ArticleResponseSchema.openapi("ArticleCreatedResponse"),
        },
      },
      description: "Article created",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema.openapi("ValidationError"),
        },
      },
      description: "Validation error",
    },
    409: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema.openapi("ConflictError"),
        },
      },
      description: "Article already exists",
    },
    502: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema.openapi("MetadataFetchError"),
        },
      },
      description: "Failed to fetch metadata",
    },
  },
});

const updateArticleRoute = createRoute({
  method: "put",
  path: "/api/articles/{id}",
  tags: ["Articles"],
  summary: "Update an article",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "Article ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateArticleInputSchema.openapi("UpdateArticleInput"),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ArticleResponseSchema.openapi("ArticleUpdatedResponse"),
        },
      },
      description: "Article updated",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Validation error",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Article not found",
    },
  },
});

const deleteArticleRoute = createRoute({
  method: "delete",
  path: "/api/articles/{id}",
  tags: ["Articles"],
  summary: "Delete an article",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "Article ID" }),
    }),
  },
  responses: {
    204: {
      description: "Article deleted",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Article not found",
    },
  },
});

// --- App with handlers ---

export const articleRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listArticlesRoute, async (c) => {
    const deps = c.get("deps");
    const query = c.req.valid("query");
    const result = await deps.articleQuery.list({
      source: query.source,
      tagName: query.tagId,
      isRead: query.isRead,
      search: query.q,
      cursor: query.cursor,
      limit: query.limit,
    });
    return c.json(
      {
        articles: result.articles.map((a) => ({
          ...a,
          memo: null,
          tags: [],
          source: SourceSchema.parse(a.source),
          updatedAt: a.createdAt.toISOString(),
          createdAt: a.createdAt.toISOString(),
          ogImageUrl: a.ogImageUrl ?? null,
          description: a.description ?? null,
        })),
        nextCursor: result.nextCursor,
      },
      200,
    );
  })
  .openapi(getArticleRoute, async (c) => {
    const deps = c.get("deps");
    const { id } = c.req.valid("param");
    const article = await deps.articleQuery.getById(id);
    if (!article) {
      return c.json({ error: "ARTICLE_NOT_FOUND", message: `Not found: ${id}` }, 404);
    }
    return c.json(toArticleResponse(article), 200);
  })
  .openapi(createArticleRoute, async (c) => {
    const deps = c.get("deps");
    const body = c.req.valid("json");
    const result = await clipArticle({
      articleRepo: deps.articleRepo,
      metadataFetcher: deps.metadataFetcher,
    })({ url: body.url, tags: body.tags, memo: body.memo });
    return result.match(
      (article) => c.json(toArticleResponse(article), 201),
      (error) => c.json(domainErrorToResponse(error), domainErrorToStatus<400 | 409 | 502>(error)),
    );
  })
  .openapi(updateArticleRoute, async (c) => {
    const deps = c.get("deps");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await updateArticle({
      articleRepo: deps.articleRepo,
    })({ id, ...body });
    return result.match(
      (article) => c.json(toArticleResponse(article), 200),
      (error) => c.json(domainErrorToResponse(error), domainErrorToStatus<400 | 404>(error)),
    );
  })
  .openapi(deleteArticleRoute, async (c) => {
    const deps = c.get("deps");
    const { id } = c.req.valid("param");
    const result = await deleteArticle({
      articleRepo: deps.articleRepo,
    })(id);
    return result.match(
      () => c.body(null, 204),
      (error) => c.json(domainErrorToResponse(error), domainErrorToStatus<404>(error)),
    );
  });
