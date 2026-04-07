import {
  CreateHighlightInputSchema,
  ErrorResponseSchema,
  HighlightListResponseSchema,
  HighlightResponseSchema,
  UpdateHighlightInputSchema,
} from "@web-clipper/shared";
import { createRoute, z } from "@hono/zod-openapi";

const articleIdParam = z.object({
  id: z.string().openapi({ description: "Article ID" }),
});

const highlightParams = z.object({
  highlightId: z.string().openapi({ description: "Highlight ID" }),
  id: z.string().openapi({ description: "Article ID" }),
});

const listHighlightsRoute = createRoute({
  method: "get",
  path: "/api/articles/{id}/highlights",
  request: {
    params: articleIdParam,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HighlightListResponseSchema.openapi("HighlightListResponse"),
        },
      },
      description: "List of highlights",
    },
  },
  summary: "List highlights for an article",
  tags: ["Highlights"],
});

const createHighlightRoute = createRoute({
  method: "post",
  path: "/api/articles/{id}/highlights",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateHighlightInputSchema.openapi("CreateHighlightInput"),
        },
      },
      required: true,
    },
    params: articleIdParam,
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: HighlightResponseSchema.openapi("HighlightCreatedResponse"),
        },
      },
      description: "Highlight created",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema.openapi("HighlightValidationError"),
        },
      },
      description: "Validation error or content not available",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema.openapi("HighlightArticleNotFoundError"),
        },
      },
      description: "Article not found",
    },
  },
  summary: "Create a highlight",
  tags: ["Highlights"],
});

const updateHighlightRoute = createRoute({
  method: "put",
  path: "/api/articles/{id}/highlights/{highlightId}",
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateHighlightInputSchema.openapi("UpdateHighlightInput"),
        },
      },
      required: true,
    },
    params: highlightParams,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HighlightResponseSchema.openapi("HighlightUpdatedResponse"),
        },
      },
      description: "Highlight updated",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema.openapi("HighlightNotFoundError"),
        },
      },
      description: "Highlight not found",
    },
  },
  summary: "Update a highlight",
  tags: ["Highlights"],
});

const deleteHighlightRoute = createRoute({
  method: "delete",
  path: "/api/articles/{id}/highlights/{highlightId}",
  request: {
    params: highlightParams,
  },
  responses: {
    204: {
      description: "Highlight deleted",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema.openapi("HighlightDeleteNotFoundError"),
        },
      },
      description: "Highlight not found",
    },
  },
  summary: "Delete a highlight",
  tags: ["Highlights"],
});

export { createHighlightRoute, deleteHighlightRoute, listHighlightsRoute, updateHighlightRoute };
