import {
  ArticleListResponseSchema,
  ArticleQueryParamsSchema,
  ArticleResponseSchema,
  CreateArticleInputSchema,
  ErrorResponseSchema,
  UpdateArticleInputSchema,
} from "@web-clipper/shared";
import { createRoute, z } from "@hono/zod-openapi";

const listArticlesRoute = createRoute({
  method: "get",
  path: "/api/articles",
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
  summary: "List articles",
  tags: ["Articles"],
});

const getArticleRoute = createRoute({
  method: "get",
  path: "/api/articles/{id}",
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
  summary: "Get article detail",
  tags: ["Articles"],
});

const createArticleRoute = createRoute({
  method: "post",
  path: "/api/articles",
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
  summary: "Clip a new article",
  tags: ["Articles"],
});

const updateArticleRoute = createRoute({
  method: "put",
  path: "/api/articles/{id}",
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateArticleInputSchema.openapi("UpdateArticleInput"),
        },
      },
      required: true,
    },
    params: z.object({
      id: z.string().openapi({ description: "Article ID" }),
    }),
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
  summary: "Update an article",
  tags: ["Articles"],
});

const generateSummaryRoute = createRoute({
  method: "post",
  path: "/api/articles/{id}/summary",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "Article ID" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ArticleResponseSchema.openapi("ArticleSummaryResponse"),
        },
      },
      description: "Summary generated",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Article not found",
    },
    502: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Summary generation failed",
    },
  },
  summary: "Generate AI summary for an article",
  tags: ["Articles"],
});

const deleteArticleRoute = createRoute({
  method: "delete",
  path: "/api/articles/{id}",
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
  summary: "Delete an article",
  tags: ["Articles"],
});

export {
  createArticleRoute,
  deleteArticleRoute,
  generateSummaryRoute,
  getArticleRoute,
  listArticlesRoute,
  updateArticleRoute,
};
