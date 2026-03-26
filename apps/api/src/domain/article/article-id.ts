import { err, ok } from "neverthrow";
import type { DomainError } from "../shared/errors.js";
import type { Result } from "neverthrow";
import { nanoid } from "nanoid";
import { z } from "zod";

const MIN_LENGTH = 1;

const ArticleIdSchema = z.string().min(MIN_LENGTH).brand<"ArticleId">();

type ArticleId = z.infer<typeof ArticleIdSchema>;

const create = (input: string): Result<ArticleId, DomainError> => {
  const parsed = ArticleIdSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      message: parsed.error.message,
      type: "INVALID_ARTICLE_ID" as const,
    });
  }
  return ok(parsed.data);
};

const generate = (): ArticleId => {
  const id = nanoid();
  return ArticleIdSchema.parse(id);
};

const ArticleIdVO = { create, generate, schema: ArticleIdSchema } as const;

export { ArticleIdVO };
export type { ArticleId };
