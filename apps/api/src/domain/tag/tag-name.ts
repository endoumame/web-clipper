import { err, ok } from "neverthrow";
import type { DomainError } from "../shared/errors.js";
import type { Result } from "neverthrow";
import { z } from "zod";

const MIN_LENGTH = 1;
const MAX_LENGTH = 50;

const TagNameSchema = z.string().trim().min(MIN_LENGTH).max(MAX_LENGTH).brand<"TagName">();

type TagName = z.infer<typeof TagNameSchema>;

const create = (input: string): Result<TagName, DomainError> => {
  const parsed = TagNameSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      message: parsed.error.message,
      type: "INVALID_TAG_NAME" as const,
    });
  }
  return ok(parsed.data);
};

const validateMany = (inputs: readonly string[]): Result<readonly TagName[], DomainError> => {
  const validated: TagName[] = [];
  for (const input of inputs) {
    const result = create(input);
    if (result.isErr()) {
      return err(result.error);
    }
    validated.push(result.value);
  }
  return ok(validated);
};

const TagNameVO = { create, schema: TagNameSchema, validateMany } as const;

export { TagNameVO };
export type { TagName };
