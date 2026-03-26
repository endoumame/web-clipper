import type { HTTP_CONFLICT, HTTP_INTERNAL_ERROR } from "../http-status.js";
import { HTTP_NO_CONTENT, HTTP_OK, HTTP_REDIRECT, HTTP_UNAUTHORIZED } from "../http-status.js";
import {
  SESSION_COOKIE_NAME,
  createExpiredSessionCookie,
  createSessionCookie,
} from "../middleware/cookie.js";
import { checkSetupStatus, getAuthStatus } from "../../application/queries/index.js";
import {
  checkSetupStatusRoute,
  githubAuthRoute,
  githubCallbackRoute,
  loginRoute,
  logoutRoute,
  meRoute,
  setupRoute,
} from "./auth-route-defs.js";
import { domainErrorToResponse, domainErrorToStatus } from "../middleware/error-handler.js";
import { githubOAuthCallback, login, logout, setupUser } from "../../application/commands/index.js";
import type { AppEnv } from "../types.js";
import type { Context } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";

const MAX_AGE_OAUTH_STATE = 600;

const buildAuthUserResponse = (
  user: { githubId: string | null; id: unknown; username: string },
  session: { expiresAt: Date; id: unknown },
): {
  body: {
    authenticated: true;
    needsSetup: false;
    user: { githubLinked: boolean; id: string; username: string };
  };
  cookie: string;
} => ({
  body: {
    authenticated: true,
    needsSetup: false,
    user: {
      githubLinked: user.githubId !== null,
      id: String(user.id),
      username: user.username,
    },
  },
  cookie: createSessionCookie(String(session.id), session.expiresAt),
});

const buildGithubRedirectUri = (origin: string): string => `${origin}/api/auth/github/callback`;

const buildOAuthStateCookie = (state: string): string =>
  `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${String(MAX_AGE_OAUTH_STATE)}`;

const CLEAR_OAUTH_STATE_COOKIE = "oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";

interface GithubOAuthDeps {
  githubOAuth: {
    exchangeCode: (code: string, uri: string) => Promise<string>;
    fetchUser: (token: string) => Promise<{ id: number; login: string }>;
  };
}

type GithubExchangeResult =
  | { githubUser: { id: number; login: string } }
  | { error: string; message: string };

const exchangeAndFetchGithubUser = async (
  deps: GithubOAuthDeps,
  code: string,
  redirectUri: string,
): Promise<GithubExchangeResult> => {
  let accessToken = "";
  try {
    accessToken = await deps.githubOAuth.exchangeCode(code, redirectUri);
  } catch {
    return { error: "OAUTH_ERROR", message: "Failed to get access token" };
  }

  try {
    const githubUser = await deps.githubOAuth.fetchUser(accessToken);
    return { githubUser };
  } catch {
    return { error: "OAUTH_ERROR", message: "Failed to get GitHub user info" };
  }
};

const isValidState = (savedState: string | null | undefined, state: string): boolean =>
  typeof savedState === "string" && savedState !== "" && savedState === state;

const buildCallbackRedirectUrl = (ctx: Context<AppEnv>): string => {
  if (ctx.env.ALLOWED_ORIGIN) {
    return ctx.env.ALLOWED_ORIGIN;
  }
  return "/";
};

const validateOAuthState = (ctx: Context<AppEnv>, state: string): Response | null => {
  const savedState = getCookie(ctx, "oauth_state");
  if (!isValidState(savedState, state)) {
    return ctx.json(
      { error: "OAUTH_ERROR", message: "Invalid state parameter" },
      HTTP_UNAUTHORIZED,
    );
  }
  return null;
};

const processGithubOAuth = async (ctx: Context<AppEnv>, code: string): Promise<Response> => {
  const deps = ctx.get("deps");
  const redirectUri = buildGithubRedirectUri(ctx.env.ALLOWED_ORIGIN);
  const tokenResult = await exchangeAndFetchGithubUser(deps, code, redirectUri);

  if ("error" in tokenResult) {
    return ctx.json(tokenResult, HTTP_UNAUTHORIZED);
  }

  const result = await githubOAuthCallback({
    sessionRepo: deps.sessionRepo,
    userRepo: deps.userRepo,
  })({
    githubId: String(tokenResult.githubUser.id),
    githubUsername: tokenResult.githubUser.login,
  });

  return result.match(
    ({ session }) => {
      ctx.header("Set-Cookie", createSessionCookie(String(session.id), session.expiresAt));
      return ctx.redirect(buildCallbackRedirectUrl(ctx), HTTP_REDIRECT);
    },
    (error) =>
      ctx.json(domainErrorToResponse(error), domainErrorToStatus<typeof HTTP_UNAUTHORIZED>(error)),
  );
};

const authRoutes = new OpenAPIHono<AppEnv>()
  .openapi(checkSetupStatusRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const result = await checkSetupStatus({ userRepo: deps.userRepo })();
    return result.match(
      (status) => ctx.json(status, HTTP_OK),
      (error) =>
        ctx.json(
          domainErrorToResponse(error),
          domainErrorToStatus<typeof HTTP_INTERNAL_ERROR>(error),
        ),
    );
  })
  .openapi(setupRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const body = ctx.req.valid("json");
    const result = await setupUser({
      passwordHasher: deps.passwordHasher,
      sessionRepo: deps.sessionRepo,
      userRepo: deps.userRepo,
    })({ password: body.password, username: body.username });
    return result.match(
      ({ session, user }) => {
        const response = buildAuthUserResponse(user, session);
        ctx.header("Set-Cookie", response.cookie);
        return ctx.json(response.body, HTTP_OK);
      },
      (error) =>
        ctx.json(domainErrorToResponse(error), domainErrorToStatus<typeof HTTP_CONFLICT>(error)),
    );
  })
  .openapi(loginRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const body = ctx.req.valid("json");
    const result = await login({
      passwordHasher: deps.passwordHasher,
      sessionRepo: deps.sessionRepo,
      userRepo: deps.userRepo,
    })({ password: body.password, username: body.username });
    return result.match(
      ({ session, user }) => {
        const response = buildAuthUserResponse(user, session);
        ctx.header("Set-Cookie", response.cookie);
        return ctx.json(response.body, HTTP_OK);
      },
      (error) =>
        ctx.json(
          domainErrorToResponse(error),
          domainErrorToStatus<typeof HTTP_UNAUTHORIZED>(error),
        ),
    );
  })
  .openapi(logoutRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const sessionId = getCookie(ctx, SESSION_COOKIE_NAME);
    if (typeof sessionId === "string" && sessionId !== "") {
      await logout({ sessionRepo: deps.sessionRepo })(sessionId);
    }
    ctx.header("Set-Cookie", createExpiredSessionCookie());
    return ctx.body(null, HTTP_NO_CONTENT);
  })
  .openapi(githubAuthRoute, (ctx) => {
    const state = crypto.randomUUID();
    const redirectUri = buildGithubRedirectUri(ctx.env.ALLOWED_ORIGIN);
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${ctx.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user&state=${state}`;
    ctx.header("Set-Cookie", buildOAuthStateCookie(state));
    return ctx.redirect(githubUrl, HTTP_REDIRECT);
  })
  .openapi(githubCallbackRoute, async (ctx) => {
    const { code, state } = ctx.req.valid("query");
    const validationError = validateOAuthState(ctx, state);

    if (validationError !== null) {
      return validationError;
    }

    ctx.header("Set-Cookie", CLEAR_OAUTH_STATE_COOKIE);
    const response = await processGithubOAuth(ctx, code);
    return response;
  })
  .openapi(meRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const sessionId = getCookie(ctx, SESSION_COOKIE_NAME);
    const result = await getAuthStatus({
      sessionRepo: deps.sessionRepo,
      userRepo: deps.userRepo,
    })(sessionId);
    return result.match(
      (status) => ctx.json(status, HTTP_OK),
      (error) =>
        ctx.json(
          domainErrorToResponse(error),
          domainErrorToStatus<typeof HTTP_INTERNAL_ERROR>(error),
        ),
    );
  });

export { authRoutes };
