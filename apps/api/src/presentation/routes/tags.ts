import {
  CreateTagInputSchema,
  ErrorResponseSchema,
  TagListResponseSchema,
  TagResponseSchema,
} from "@web-clipper/shared";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createTag, deleteTag } from "../../application/commands/index.js";
import { domainErrorToResponse, domainErrorToStatus } from "../middleware/error-handler.js";
import type { AppEnv } from "../types.js";

// oxlint-disable no-magic-numbers -- HTTP status codes are self-documenting in route handler context

const INITIAL_ARTICLE_COUNT = 0;

// --- Route definitions ---

const listTagsRoute = createRoute({
  method: "get",
  path: "/api/tags",
  responses: {
    200: {
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
    201: {
      content: {
        "application/json": {
          schema: TagResponseSchema.openapi("TagCreatedResponse"),
        },
      },
      description: "Tag created",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Validation error",
    },
    409: {
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
    204: {
      description: "Tag deleted",
    },
    404: {
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
      200,
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
          201,
        ),
      (error) => ctx.json(domainErrorToResponse(error), domainErrorToStatus<400 | 409>(error)),
    );
  })
  .openapi(deleteTagRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const { id } = ctx.req.valid("param");
    const result = await deleteTag({ tagRepo: deps.tagRepo })(id);
    return result.match(
      () => ctx.body(null, 204),
      (error) => ctx.json(domainErrorToResponse(error), domainErrorToStatus<404>(error)),
    );
  });

export { tagRoutes };
