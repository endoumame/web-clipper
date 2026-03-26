import { z } from "zod";

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 50;

// CreateTagInput
const CreateTagInputSchema = z.object({
  name: z.string().min(MIN_NAME_LENGTH).max(MAX_NAME_LENGTH).trim(),
});

type CreateTagInput = z.infer<typeof CreateTagInputSchema>;

// TagResponse
const TagResponseSchema = z.object({
  articleCount: z.number(),
  createdAt: z.string(),
  id: z.string(),
  name: z.string(),
});

type TagResponse = z.infer<typeof TagResponseSchema>;

// TagListResponse
const TagListResponseSchema = z.object({
  tags: z.array(TagResponseSchema),
});

type TagListResponse = z.infer<typeof TagListResponseSchema>;

export { CreateTagInputSchema, TagListResponseSchema, TagResponseSchema };
export type { CreateTagInput, TagListResponse, TagResponse };
