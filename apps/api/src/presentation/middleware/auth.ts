import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../types.js";
import { SessionEntity } from "../../domain/entities/mod.js";
import { SessionIdVO } from "../../domain/values/mod.js";
import { SESSION_COOKIE_NAME } from "./cookie.js";

export const sessionAuth = async (c: Context<AppEnv>, next: Next) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionId) {
    return c.json({ error: "UNAUTHORIZED", message: "Authentication required" }, 401);
  }

  const parsed = SessionIdVO.create(sessionId);
  if (parsed.isErr()) {
    return c.json({ error: "UNAUTHORIZED", message: "Invalid session" }, 401);
  }

  const deps = c.get("deps");
  const result = await deps.sessionRepo.findById(parsed.value);

  const session = result.match(
    (s) => s,
    () => null,
  );

  if (!session || SessionEntity.isExpired(session)) {
    return c.json({ error: "UNAUTHORIZED", message: "Session expired" }, 401);
  }

  c.set("currentUserId", session.userId as string);
  await next();
};
