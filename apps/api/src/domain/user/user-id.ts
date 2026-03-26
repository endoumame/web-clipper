import { err, ok } from "neverthrow";
import type { DomainError } from "../shared/errors.js";
import type { Result } from "neverthrow";
import { nanoid } from "nanoid";
import { z } from "zod";

const MIN_LENGTH = 1;

const UserIdSchema = z.string().min(MIN_LENGTH).brand<"UserId">();

type UserId = z.infer<typeof UserIdSchema>;

const create = (input: string): Result<UserId, DomainError> => {
  const parsed = UserIdSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      message: parsed.error.message,
      type: "INVALID_USER_ID" as const,
    });
  }
  return ok(parsed.data);
};

const generate = (): UserId => {
  const id = nanoid();
  return UserIdSchema.parse(id);
};

const UserIdVO = { create, generate, schema: UserIdSchema } as const;

export { UserIdVO };
export type { UserId };
