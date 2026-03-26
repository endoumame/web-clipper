import { err, ok } from "neverthrow";
import type { DomainError } from "../shared/errors.js";
import type { Result } from "neverthrow";
import { z } from "zod";

const SessionIdSchema = z.uuid().brand<"SessionId">();

type SessionId = z.infer<typeof SessionIdSchema>;

const create = (input: string): Result<SessionId, DomainError> => {
  const parsed = SessionIdSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      message: parsed.error.message,
      type: "INVALID_SESSION_ID" as const,
    });
  }
  return ok(parsed.data);
};

const generate = (): SessionId => {
  const id = globalThis.crypto.randomUUID();
  return SessionIdSchema.parse(id);
};

const SessionIdVO = { create, generate, schema: SessionIdSchema } as const;

export { SessionIdVO };
export type { SessionId };
