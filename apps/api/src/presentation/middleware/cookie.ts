const SESSION_COOKIE_NAME = "session_id";

const createSessionCookie = (sessionId: string, expiresAt: Date): string =>
  [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`,
  ].join("; ");

const createExpiredSessionCookie = (): string =>
  [`${SESSION_COOKIE_NAME}=`, "Path=/", "HttpOnly", "Secure", "SameSite=Lax", "Max-Age=0"].join(
    "; ",
  );

// Re-export getCookie so auth.ts can access it without adding another direct dependency
export { getCookie } from "hono/cookie";
export { createExpiredSessionCookie, createSessionCookie, SESSION_COOKIE_NAME };
