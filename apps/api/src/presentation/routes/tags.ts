import {
  CreateTagInputSchema,
  ErrorResponseSchema,
  TagListResponseSchema,
  TagResponseSchema,
} from "@web-clipper/shared";
import {
  HTTP_BAD_REQUEST,
  HTTP_CONFLICT,
  HTTP_CREATED,
  HTTP_NOT_FOUND,
  HTTP_NO_CONTENT,
  HTTP_OK,
} from "../http-status.js";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createTag, deleteTag } from "../../application/commands/index.js";
import { domainErrorToResponse, domainErrorToStatus } from "../middleware/error-handler.js";
import type { AppEnv } from "../types.js";

const INITIAL_ARTICLE_COUNT = 0;

// --- Route definitions ---

const listTagsRoute = createRoute({
  method: "get",
  path: "/api/tags",
  responses: {
    [HTTP_OK]: {
      content: {
        "application/json": {
          schema: TagListResponseSchema.openapi("TagListResponse"),
        },
      },
      description: "List of tags",
    },
  },
  summary: "List all tags with article count",
  tags: ["Tags"],
});

const createTagRoute = createRoute({
  method: "post",
  path: "/api/tags",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateTagInputSchema.openapi("CreateTagInput"),
        },
      },
      required: true,
    },
  },
  responses: {
    [HTTP_CREATED]: {
      content: {
        "application/json": {
          schema: TagResponseSchema.openapi("TagCreatedResponse"),
        },
      },
      description: "Tag created",
    },
    [HTTP_BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Validation error",
    },
    [HTTP_CONFLICT]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Tag already exists",
    },
  },
  summary: "Create a new tag",
  tags: ["Tags"],
});

const deleteTagRoute = createRoute({
  method: "delete",
  path: "/api/tags/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "Tag ID" }),
    }),
  },
  responses: {
    [HTTP_NO_CONTENT]: {
      description: "Tag deleted",
    },
    [HTTP_NOT_FOUND]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Tag not found",
    },
  },
  summary: "Delete a tag",
  tags: ["Tags"],
});

// --- App with handlers ---

const tagRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listTagsRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const result = await deps.tagQuery.list();
    return ctx.json(
      {
        tags: result.map((tag) => ({
          articleCount: tag.articleCount,
          createdAt: tag.createdAt.toISOString(),
          id: tag.id,
          name: tag.name,
        })),
      },
      HTTP_OK,
    );
  })
  .openapi(createTagRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const { name } = ctx.req.valid("json");
    const result = await createTag({ tagRepo: deps.tagRepo })(name);
    return result.match(
      (tag) =>
        ctx.json(
          {
            articleCount: INITIAL_ARTICLE_COUNT,
            createdAt: tag.createdAt.toISOString(),
            id: tag.id,
            name: tag.name,
          },
          HTTP_CREATED,
        ),
      (error) =>
        ctx.json(
          domainErrorToResponse(error),
          domainErrorToStatus<typeof HTTP_BAD_REQUEST | typeof HTTP_CONFLICT>(error),
        ),
    );
  })
  .openapi(deleteTagRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const { id } = ctx.req.valid("param");
    const result = await deleteTag({ tagRepo: deps.tagRepo })(id);
    return result.match(
      () => ctx.body(null, HTTP_NO_CONTENT),
      (error) =>
        ctx.json(domainErrorToResponse(error), domainErrorToStatus<typeof HTTP_NOT_FOUND>(error)),
    );
  });

export { tagRoutes };
