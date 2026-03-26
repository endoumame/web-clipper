import {
  AuthStatusResponseSchema,
  ErrorResponseSchema,
  LoginInputSchema,
  SetupInputSchema,
  SetupStatusResponseSchema,
} from "@web-clipper/shared";
import { createRoute, z } from "@hono/zod-openapi";

const checkSetupStatusRoute = createRoute({
  method: "get",
  path: "/api/auth/status",
  responses: {
    200: {
      content: {
        "application/json": { schema: SetupStatusResponseSchema.openapi("SetupStatusResponse") },
      },
      description: "Setup status",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Internal server error",
    },
  },
  summary: "Check setup status",
  tags: ["Auth"],
});

const setupRoute = createRoute({
  method: "post",
  path: "/api/auth/setup",
  request: {
    body: {
      content: { "application/json": { schema: SetupInputSchema.openapi("SetupInput") } },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: AuthStatusResponseSchema.openapi("SetupResponse") },
      },
      description: "Setup completed",
    },
    409: {
      content: {
        "application/json": { schema: ErrorResponseSchema.openapi("SetupConflictError") },
      },
      description: "Setup already completed",
    },
  },
  summary: "Initial user setup",
  tags: ["Auth"],
});

const loginRoute = createRoute({
  method: "post",
  path: "/api/auth/login",
  request: {
    body: {
      content: { "application/json": { schema: LoginInputSchema.openapi("LoginInput") } },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: AuthStatusResponseSchema.openapi("LoginResponse") },
      },
      description: "Login successful",
    },
    401: {
      content: {
        "application/json": { schema: ErrorResponseSchema.openapi("LoginUnauthorizedError") },
      },
      description: "Invalid credentials",
    },
  },
  summary: "Login with credentials",
  tags: ["Auth"],
});

const logoutRoute = createRoute({
  method: "post",
  path: "/api/auth/logout",
  responses: { 204: { description: "Logged out" } },
  summary: "Logout",
  tags: ["Auth"],
});

const githubAuthRoute = createRoute({
  method: "get",
  path: "/api/auth/github",
  responses: { 302: { description: "Redirect to GitHub" } },
  summary: "Start GitHub OAuth flow",
  tags: ["Auth"],
});

const githubCallbackRoute = createRoute({
  method: "get",
  path: "/api/auth/github/callback",
  request: { query: z.object({ code: z.string(), state: z.string() }) },
  responses: {
    302: { description: "Redirect to app" },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "OAuth error",
    },
  },
  summary: "GitHub OAuth callback",
  tags: ["Auth"],
});

const meRoute = createRoute({
  method: "get",
  path: "/api/auth/me",
  responses: {
    200: {
      content: { "application/json": { schema: AuthStatusResponseSchema.openapi("MeResponse") } },
      description: "Current auth status",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Internal server error",
    },
  },
  summary: "Get current user",
  tags: ["Auth"],
});

export {
  checkSetupStatusRoute,
  githubAuthRoute,
  githubCallbackRoute,
  loginRoute,
  logoutRoute,
  meRoute,
  setupRoute,
};
