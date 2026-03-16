import { z } from "zod";

// Source enum
export const SourceSchema = z.enum([
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
export type Source = z.infer<typeof SourceSchema>;

// Pagination cursor
export const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});
export type CursorPagination = z.infer<typeof CursorPaginationSchema>;
