import { err, ok } from "neverthrow";
import type { DomainError } from "../shared/errors.js";
import type { Result } from "neverthrow";
import { z } from "zod";

const ArticleUrlSchema = z.url().brand<"ArticleUrl">();

type ArticleUrl = z.infer<typeof ArticleUrlSchema>;

const create = (input: string): Result<ArticleUrl, DomainError> => {
  const parsed = ArticleUrlSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      message: parsed.error.message,
      type: "INVALID_URL" as const,
    });
  }
  return ok(parsed.data);
};

const ArticleUrlVO = { create, schema: ArticleUrlSchema } as const;

export { ArticleUrlVO };
export type { ArticleUrl };
