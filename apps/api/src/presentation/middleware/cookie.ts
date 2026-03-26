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

export { createExpiredSessionCookie, createSessionCookie, SESSION_COOKIE_NAME };
