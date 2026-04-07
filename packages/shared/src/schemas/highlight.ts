import { z } from "zod";

const MIN_TEXT_LENGTH = 1;
const MAX_TEXT_LENGTH = 5000;
const MAX_NOTE_LENGTH = 10_000;
const MAX_COLOR_LENGTH = 20;

const CreateHighlightInputSchema = z.object({
  color: z.string().max(MAX_COLOR_LENGTH).optional(),
  endOffset: z.number().int().nonnegative(),
  highlightedText: z.string().min(MIN_TEXT_LENGTH).max(MAX_TEXT_LENGTH),
  note: z.string().max(MAX_NOTE_LENGTH).nullable().optional(),
  prefixContext: z.string().default(""),
  startOffset: z.number().int().nonnegative(),
  suffixContext: z.string().default(""),
});

type CreateHighlightInput = z.infer<typeof CreateHighlightInputSchema>;

const UpdateHighlightInputSchema = z.object({
  color: z.string().max(MAX_COLOR_LENGTH).optional(),
  note: z.string().max(MAX_NOTE_LENGTH).nullable().optional(),
});

type UpdateHighlightInput = z.infer<typeof UpdateHighlightInputSchema>;

const HighlightResponseSchema = z.object({
  articleId: z.string(),
  color: z.string(),
  createdAt: z.string(),
  endOffset: z.number(),
  highlightedText: z.string(),
  id: z.string(),
  note: z.string().nullable(),
  prefixContext: z.string(),
  startOffset: z.number(),
  suffixContext: z.string(),
  updatedAt: z.string(),
});

type HighlightResponse = z.infer<typeof HighlightResponseSchema>;

const HighlightListResponseSchema = z.object({
  highlights: z.array(HighlightResponseSchema),
});

type HighlightListResponse = z.infer<typeof HighlightListResponseSchema>;

export {
  CreateHighlightInputSchema,
  HighlightListResponseSchema,
  HighlightResponseSchema,
  UpdateHighlightInputSchema,
};
export type {
  CreateHighlightInput,
  HighlightListResponse,
  HighlightResponse,
  UpdateHighlightInput,
};
