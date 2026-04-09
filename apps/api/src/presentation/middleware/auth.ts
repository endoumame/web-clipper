import type { Context, Next } from "hono";
import { SessionEntity, SessionIdVO } from "../../domain/session/index.js";
import type { AppEnv } from "../types.js";
import { SESSION_COOKIE_NAME } from "./cookie.js";
import type { Session } from "../../domain/session/index.js";
import { getCookie } from "hono/cookie";

const UNAUTHORIZED_STATUS = 401;
const BEARER_PREFIX = "Bearer ";

const unauthorizedResponse = (ctx: Context<AppEnv>, message: string): Response =>
  ctx.json({ error: "UNAUTHORIZED", message }, UNAUTHORIZED_STATUS);

const findValidSession = async (
  ctx: Context<AppEnv>,
  sessionId: string,
): Promise<Session | null> => {
  const parsed = SessionIdVO.create(sessionId);
  if (parsed.isErr()) {
    return null;
  }

  const deps = ctx.get("deps");
  const result = await deps.sessionRepo.findById(parsed.value);
  return result.match(
    (sv) => sv,
    () => null,
  );
};

const extractSessionId = (ctx: Context<AppEnv>): string | null => {
  const cookieValue = getCookie(ctx, SESSION_COOKIE_NAME);
  if (typeof cookieValue === "string" && cookieValue !== "") {
    return cookieValue;
  }
  const authHeader = ctx.req.header("Authorization");
  if (typeof authHeader === "string" && authHeader.startsWith(BEARER_PREFIX)) {
    const token = authHeader.slice(BEARER_PREFIX.length);
    if (token !== "") {
      return token;
    }
  }
  return null;
};

const sessionAuth = async (ctx: Context<AppEnv>, next: Next): Promise<Response | undefined> => {
  const sessionId = extractSessionId(ctx);
  if (sessionId === null) {
    return unauthorizedResponse(ctx, "Authentication required");
  }

  const session = await findValidSession(ctx, sessionId);

  if (session === null || SessionEntity.isExpired(session)) {
    return unauthorizedResponse(ctx, "Session expired");
  }

  await next();
};

export { extractSessionId, sessionAuth };
