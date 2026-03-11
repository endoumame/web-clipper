export const SESSION_COOKIE_NAME = "session_id";

export const createSessionCookie = (sessionId: string, expiresAt: Date): string =>
  [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`,
  ].join("; ");

export const createExpiredSessionCookie = (): string =>
  [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
