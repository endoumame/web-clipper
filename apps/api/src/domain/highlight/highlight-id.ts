import { err, ok } from "neverthrow";
import type { DomainError } from "../shared/errors.js";
import type { Result } from "neverthrow";
import { nanoid } from "nanoid";
import { z } from "zod";

const MIN_LENGTH = 1;

const HighlightIdSchema = z.string().min(MIN_LENGTH).brand<"HighlightId">();

type HighlightId = z.infer<typeof HighlightIdSchema>;

const create = (input: string): Result<HighlightId, DomainError> => {
  const parsed = HighlightIdSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      message: parsed.error.message,
      type: "INVALID_HIGHLIGHT_ID" as const,
    });
  }
  return ok(parsed.data);
};

const generate = (): HighlightId => {
  const id = nanoid();
  return HighlightIdSchema.parse(id);
};

const HighlightIdVO = { create, generate, schema: HighlightIdSchema } as const;

export { HighlightIdVO };
export type { HighlightId };
