import { z } from "zod";
import { ok, err, type Result } from "neverthrow";
import type { DomainError } from "../shared/errors.js";

const ArticleUrlSchema = z.string().url().brand<"ArticleUrl">();
export type ArticleUrl = z.infer<typeof ArticleUrlSchema>;

const create = (input: string): Result<ArticleUrl, DomainError> => {
  const parsed = ArticleUrlSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      type: "INVALID_URL" as const,
      message: parsed.error.message,
    });
  }
  return ok(parsed.data);
};

export const ArticleUrlVO = { create, schema: ArticleUrlSchema } as const;
