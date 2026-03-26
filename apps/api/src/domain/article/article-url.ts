import { err, ok } from "neverthrow";
import type { DomainError } from "../shared/errors.js";
import type { Result } from "neverthrow";
import { z } from "zod";

// oxlint-disable-next-line no-deprecated -- z.string().url() is the current stable API
const ArticleUrlSchema = z.string().url().brand<"ArticleUrl">();

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
