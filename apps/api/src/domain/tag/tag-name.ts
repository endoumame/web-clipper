import { z } from "zod";
import { ok, err, type Result } from "neverthrow";
import type { DomainError } from "../shared/errors.js";

const TagNameSchema = z.string().trim().min(1).max(50).brand<"TagName">();
export type TagName = z.infer<typeof TagNameSchema>;

const create = (input: string): Result<TagName, DomainError> => {
  const parsed = TagNameSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      type: "INVALID_TAG_NAME" as const,
      message: parsed.error.message,
    });
  }
  return ok(parsed.data);
};

const validateMany = (inputs: readonly string[]): Result<readonly TagName[], DomainError> => {
  const validated: TagName[] = [];
  for (const input of inputs) {
    const result = create(input);
    if (result.isErr()) return err(result.error);
    validated.push(result.value);
  }
  return ok(validated);
};

export const TagNameVO = { create, validateMany, schema: TagNameSchema } as const;
