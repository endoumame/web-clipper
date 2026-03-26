import { z } from "zod";

const MIN_LIMIT = 1;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

// Source enum
const SourceSchema = z.enum([
  "twitter",
  "qiita",
  "zenn",
  "hatena",
  "github",
  "classmethod",
  "medium",
  "note",
  "devto",
  "stackoverflow",
  "other",
]);

type Source = z.infer<typeof SourceSchema>;

// Pagination cursor
const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(MIN_LIMIT).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

type CursorPagination = z.infer<typeof CursorPaginationSchema>;

export { CursorPaginationSchema, SourceSchema };
export type { CursorPagination, Source };
