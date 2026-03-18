import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  CreateTagInputSchema,
  TagListResponseSchema,
  TagResponseSchema,
  ErrorResponseSchema,
} from "@web-clipper/shared";
import type { AppEnv } from "../types.js";
import { domainErrorToResponse, domainErrorToStatus } from "../middleware/error-handler.js";
import { createTag, deleteTag } from "../../application/commands/mod.js";
import { listTags } from "../../application/queries/mod.js";

// --- Route definitions ---

const listTagsRoute = createRoute({
  method: "get",
  path: "/api/tags",
  tags: ["Tags"],
  summary: "List all tags with article count",
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
});

const createTagRoute = createRoute({
  method: "post",
  path: "/api/tags",
  tags: ["Tags"],
  summary: "Create a new tag",
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
});

const deleteTagRoute = createRoute({
  method: "delete",
  path: "/api/tags/{id}",
  tags: ["Tags"],
  summary: "Delete a tag",
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
});

// --- App with handlers ---

export const tagRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listTagsRoute, async (c) => {
    const deps = c.get("deps");
    const result = await listTags(deps.db)();
    return c.json(
      {
        tags: result.map((t) => ({
          id: t.id,
          name: t.name,
          articleCount: t.articleCount,
          createdAt: t.createdAt.toISOString(),
        })),
      },
      200,
    );
  })
  .openapi(createTagRoute, async (c) => {
    const deps = c.get("deps");
    const { name } = c.req.valid("json");
    const result = await createTag({ tagRepo: deps.tagRepo })(name);
    return result.match(
      (tag) =>
        c.json(
          {
            id: tag.id,
            name: tag.name,
            articleCount: 0,
            createdAt: tag.createdAt.toISOString(),
          },
          201,
        ),
      (error) => c.json(domainErrorToResponse(error), domainErrorToStatus<400 | 409>(error)),
    );
  })
  .openapi(deleteTagRoute, async (c) => {
    const deps = c.get("deps");
    const { id } = c.req.valid("param");
    const result = await deleteTag({ tagRepo: deps.tagRepo })(id);
    return result.match(
      () => c.body(null, 204),
      (error) => c.json(domainErrorToResponse(error), domainErrorToStatus<404>(error)),
    );
  });
