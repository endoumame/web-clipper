import { z } from "zod";
import { ok, err, type Result } from "neverthrow";
import { nanoid } from "nanoid";
import type { DomainError } from "../shared/errors.js";

const ArticleIdSchema = z.string().min(1).brand<"ArticleId">();
export type ArticleId = z.infer<typeof ArticleIdSchema>;

const create = (input: string): Result<ArticleId, DomainError> => {
  const parsed = ArticleIdSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      type: "INVALID_ARTICLE_ID" as const,
      message: parsed.error.message,
    });
  }
  return ok(parsed.data);
};

const generate = (): ArticleId => {
  const id = nanoid();
  return ArticleIdSchema.parse(id);
};

export const ArticleIdVO = { create, generate, schema: ArticleIdSchema } as const;
