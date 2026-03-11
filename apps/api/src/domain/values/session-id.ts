import { z } from "zod";
import { ok, err, type Result } from "neverthrow";
import type { DomainError } from "../errors.js";

const SessionIdSchema = z.string().uuid().brand<"SessionId">();
export type SessionId = z.infer<typeof SessionIdSchema>;

const create = (input: string): Result<SessionId, DomainError> => {
  const parsed = SessionIdSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      type: "SESSION_NOT_FOUND" as const,
      message: parsed.error.message,
    });
  }
  return ok(parsed.data);
};

const generate = (): SessionId => {
  const id = crypto.randomUUID();
  return SessionIdSchema.parse(id);
};

export const SessionIdVO = { create, generate, schema: SessionIdSchema } as const;
