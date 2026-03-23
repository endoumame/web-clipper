import { z } from "zod";

import { CursorPaginationSchema, SourceSchema } from "./common.js";

// CreateArticleInput - for POST /api/articles
export const CreateArticleInputSchema = z.object({
  url: z.string().url(),
  tags: z.array(z.string().min(1).max(50)).optional().default([]),
  memo: z.string().optional(),
});
export type CreateArticleInput = z.infer<typeof CreateArticleInputSchema>;

// UpdateArticleInput - for PUT /api/articles/:id
export const UpdateArticleInputSchema = z.object({
  memo: z.string().nullable().optional(),
  isRead: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
});
export type UpdateArticleInput = z.infer<typeof UpdateArticleInputSchema>;

// ArticleResponse - API response shape
export const ArticleResponseSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
  description: z.string().nullable(),
  source: SourceSchema,
  ogImageUrl: z.string().nullable(),
  memo: z.string().nullable(),
  aiSummary: z.string().nullable(),
  isRead: z.boolean(),
  tags: z.array(z.string()),
  createdAt: z.string(), // ISO 8601
  updatedAt: z.string(), // ISO 8601
});
export type ArticleResponse = z.infer<typeof ArticleResponseSchema>;

// ArticleListResponse - paginated list
export const ArticleListResponseSchema = z.object({
  articles: z.array(ArticleResponseSchema),
  nextCursor: z.string().nullable(),
});
export type ArticleListResponse = z.infer<typeof ArticleListResponseSchema>;

// ArticleQueryParams - for GET /api/articles
export const ArticleQueryParamsSchema = z.object({
  q: z.string().optional(),
  source: SourceSchema.optional(),
  tagId: z.string().optional(),
  isRead: z.coerce.boolean().optional(),
  ...CursorPaginationSchema.shape,
});
export type ArticleQueryParams = z.infer<typeof ArticleQueryParamsSchema>;
