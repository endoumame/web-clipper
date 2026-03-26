import { CursorPaginationSchema, SourceSchema } from "./common.js";
import { z } from "zod";

const MIN_TAG_LENGTH = 1;
const MAX_TAG_LENGTH = 50;

// CreateArticleInput - for POST /api/articles
const CreateArticleInputSchema = z.object({
  memo: z.string().optional(),
  tags: z.array(z.string().min(MIN_TAG_LENGTH).max(MAX_TAG_LENGTH)).optional().default([]),
  url: z.url(),
});

type CreateArticleInput = z.infer<typeof CreateArticleInputSchema>;

// UpdateArticleInput - for PUT /api/articles/:id
const UpdateArticleInputSchema = z.object({
  isRead: z.boolean().optional(),
  memo: z.string().nullable().optional(),
  tags: z.array(z.string().min(MIN_TAG_LENGTH).max(MAX_TAG_LENGTH)).optional(),
});

type UpdateArticleInput = z.infer<typeof UpdateArticleInputSchema>;

// ArticleResponse - API response shape
const ArticleResponseSchema = z.object({
  aiSummary: z.string().nullable(),
  // ISO 8601
  createdAt: z.string(),
  description: z.string().nullable(),
  id: z.string(),
  isRead: z.boolean(),
  memo: z.string().nullable(),
  ogImageUrl: z.string().nullable(),
  source: SourceSchema,
  tags: z.array(z.string()),
  title: z.string(),
  // ISO 8601
  updatedAt: z.string(),
  url: z.url(),
});

type ArticleResponse = z.infer<typeof ArticleResponseSchema>;

// ArticleListResponse - paginated list
const ArticleListResponseSchema = z.object({
  articles: z.array(ArticleResponseSchema),
  nextCursor: z.string().nullable(),
});

type ArticleListResponse = z.infer<typeof ArticleListResponseSchema>;

// ArticleQueryParams - for GET /api/articles
const ArticleQueryParamsSchema = z.object({
  isRead: z.coerce.boolean().optional(),
  search: z.string().optional(),
  source: SourceSchema.optional(),
  tagId: z.string().optional(),
  ...CursorPaginationSchema.shape,
});

type ArticleQueryParams = z.infer<typeof ArticleQueryParamsSchema>;

export {
  ArticleListResponseSchema,
  ArticleQueryParamsSchema,
  ArticleResponseSchema,
  CreateArticleInputSchema,
  UpdateArticleInputSchema,
};
export type {
  ArticleListResponse,
  ArticleQueryParams,
  ArticleResponse,
  CreateArticleInput,
  UpdateArticleInput,
};
