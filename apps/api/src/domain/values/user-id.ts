import { z } from "zod";
import { ok, err, type Result } from "neverthrow";
import { nanoid } from "nanoid";
import type { DomainError } from "../errors.js";

const UserIdSchema = z.string().min(1).brand<"UserId">();
export type UserId = z.infer<typeof UserIdSchema>;

const create = (input: string): Result<UserId, DomainError> => {
  const parsed = UserIdSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      type: "INVALID_CREDENTIALS" as const,
      message: parsed.error.message,
    });
  }
  return ok(parsed.data);
};

const generate = (): UserId => {
  const id = nanoid();
  return UserIdSchema.parse(id);
};

export const UserIdVO = { create, generate, schema: UserIdSchema } as const;
