import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";
import {
  SetupInputSchema,
  LoginInputSchema,
  AuthStatusResponseSchema,
  SetupStatusResponseSchema,
  ErrorResponseSchema,
} from "@web-clipper/shared";
import type { AppEnv } from "../types.js";
import { domainErrorToResponse, domainErrorToStatus } from "../middleware/error-handler.js";
import { setupUser, login, logout, githubOAuthCallback } from "../../application/commands/mod.js";
import { checkSetupStatus, getAuthStatus } from "../../application/queries/mod.js";
import {
  SESSION_COOKIE_NAME,
  createSessionCookie,
  createExpiredSessionCookie,
} from "../middleware/cookie.js";

// --- Route definitions ---

const checkSetupStatusRoute = createRoute({
  method: "get",
  path: "/api/auth/status",
  tags: ["Auth"],
  summary: "Check setup status",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SetupStatusResponseSchema.openapi("SetupStatusResponse"),
        },
      },
      description: "Setup status",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Internal server error",
    },
  },
});

const setupRoute = createRoute({
  method: "post",
  path: "/api/auth/setup",
  tags: ["Auth"],
  summary: "Initial user setup",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SetupInputSchema.openapi("SetupInput"),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AuthStatusResponseSchema.openapi("SetupResponse"),
        },
      },
      description: "Setup completed",
    },
    409: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema.openapi("SetupConflictError"),
        },
      },
      description: "Setup already completed",
    },
  },
});

const loginRoute = createRoute({
  method: "post",
  path: "/api/auth/login",
  tags: ["Auth"],
  summary: "Login with credentials",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginInputSchema.openapi("LoginInput"),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AuthStatusResponseSchema.openapi("LoginResponse"),
        },
      },
      description: "Login successful",
    },
    401: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema.openapi("LoginUnauthorizedError"),
        },
      },
      description: "Invalid credentials",
    },
  },
});

const logoutRoute = createRoute({
  method: "post",
  path: "/api/auth/logout",
  tags: ["Auth"],
  summary: "Logout",
  responses: {
    204: {
      description: "Logged out",
    },
  },
});

const githubAuthRoute = createRoute({
  method: "get",
  path: "/api/auth/github",
  tags: ["Auth"],
  summary: "Start GitHub OAuth flow",
  responses: {
    302: { description: "Redirect to GitHub" },
  },
});

const githubCallbackRoute = createRoute({
  method: "get",
  path: "/api/auth/github/callback",
  tags: ["Auth"],
  summary: "GitHub OAuth callback",
  request: {
    query: z.object({
      code: z.string(),
      state: z.string(),
    }),
  },
  responses: {
    302: { description: "Redirect to app" },
    401: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "OAuth error",
    },
  },
});

const meRoute = createRoute({
  method: "get",
  path: "/api/auth/me",
  tags: ["Auth"],
  summary: "Get current user",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AuthStatusResponseSchema.openapi("MeResponse"),
        },
      },
      description: "Current auth status",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Internal server error",
    },
  },
});

// --- App with handlers ---

export const authRoutes = new OpenAPIHono<AppEnv>()
  .openapi(checkSetupStatusRoute, async (c) => {
    const deps = c.get("deps");
    const result = await checkSetupStatus({ userRepo: deps.userRepo })();
    return result.match(
      (status) => c.json(status, 200),
      (error) => c.json(domainErrorToResponse(error), domainErrorToStatus(error) as 500),
    );
  })
  .openapi(setupRoute, async (c) => {
    const deps = c.get("deps");
    const body = c.req.valid("json");
    const result = await setupUser({
      userRepo: deps.userRepo,
      sessionRepo: deps.sessionRepo,
      passwordHasher: deps.passwordHasher,
    })({ username: body.username, password: body.password });
    return result.match(
      ({ user, session }) => {
        c.header("Set-Cookie", createSessionCookie(session.id as string, session.expiresAt));
        return c.json(
          {
            authenticated: true,
            user: {
              id: user.id as string,
              username: user.username,
              githubLinked: user.githubId !== null,
            },
            needsSetup: false,
          },
          200,
        );
      },
      (error) => c.json(domainErrorToResponse(error), domainErrorToStatus(error) as 409),
    );
  })
  .openapi(loginRoute, async (c) => {
    const deps = c.get("deps");
    const body = c.req.valid("json");
    const result = await login({
      userRepo: deps.userRepo,
      sessionRepo: deps.sessionRepo,
      passwordHasher: deps.passwordHasher,
    })({ username: body.username, password: body.password });
    return result.match(
      ({ user, session }) => {
        c.header("Set-Cookie", createSessionCookie(session.id as string, session.expiresAt));
        return c.json(
          {
            authenticated: true,
            user: {
              id: user.id as string,
              username: user.username,
              githubLinked: user.githubId !== null,
            },
            needsSetup: false,
          },
          200,
        );
      },
      (error) => c.json(domainErrorToResponse(error), domainErrorToStatus(error) as 401),
    );
  })
  .openapi(logoutRoute, async (c) => {
    const deps = c.get("deps");
    const sessionId = getCookie(c, SESSION_COOKIE_NAME);
    if (sessionId) {
      await logout({ sessionRepo: deps.sessionRepo })(sessionId);
    }
    c.header("Set-Cookie", createExpiredSessionCookie());
    return new Response(null, { status: 204 }) as unknown as Response & { status: 204 };
  })
  .openapi(githubAuthRoute, async (c) => {
    const state = crypto.randomUUID();
    const redirectUri = `${c.env.ALLOWED_ORIGIN}/api/auth/github/callback`;
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${c.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user&state=${state}`;

    c.header(
      "Set-Cookie",
      "oauth_state=" + state + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600",
    );
    return c.redirect(githubUrl, 302);
  })
  .openapi(githubCallbackRoute, async (c) => {
    const { code, state } = c.req.valid("query");
    const savedState = getCookie(c, "oauth_state");

    // Validate state (CSRF protection)
    if (!savedState || savedState !== state) {
      return c.json({ error: "OAUTH_ERROR", message: "Invalid state parameter" }, 401);
    }

    // Clear state cookie
    c.header(
      "Set-Cookie",
      "oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    );

    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      return c.json({ error: "OAUTH_ERROR", message: "Failed to get access token" }, 401);
    }

    // Get GitHub user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "web-clipper",
      },
    });

    const githubUser = (await userRes.json()) as { id: number; login: string };
    if (!githubUser.id) {
      return c.json({ error: "OAUTH_ERROR", message: "Failed to get GitHub user info" }, 401);
    }

    // Process OAuth callback
    const deps = c.get("deps");
    const result = await githubOAuthCallback({
      userRepo: deps.userRepo,
      sessionRepo: deps.sessionRepo,
    })({
      githubId: String(githubUser.id),
      githubUsername: githubUser.login,
    });

    return result.match(
      ({ session }) => {
        c.header("Set-Cookie", createSessionCookie(session.id as string, session.expiresAt));
        const redirectUrl = c.env.ALLOWED_ORIGIN || "/";
        return c.redirect(redirectUrl, 302);
      },
      (error) => c.json(domainErrorToResponse(error), domainErrorToStatus(error) as 401),
    );
  })
  .openapi(meRoute, async (c) => {
    const deps = c.get("deps");
    const sessionId = getCookie(c, SESSION_COOKIE_NAME);
    const result = await getAuthStatus({
      userRepo: deps.userRepo,
      sessionRepo: deps.sessionRepo,
    })(sessionId);
    return result.match(
      (status) => c.json(status, 200),
      (error) => c.json(domainErrorToResponse(error), domainErrorToStatus(error) as 500),
    );
  });
