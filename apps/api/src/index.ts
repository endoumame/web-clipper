import type { AppEnv, Bindings } from "./presentation/types.js";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { articleRoutes } from "./presentation/routes/articles.js";
import { authRoutes } from "./presentation/routes/auth.js";
import { cors } from "hono/cors";
import { createDeps } from "./infrastructure/deps-factory.js";
import { healthRoutes } from "./presentation/routes/health.js";
import { sessionAuth } from "./presentation/middleware/auth.js";
import { tagRoutes } from "./presentation/routes/tags.js";

const base = new OpenAPIHono<AppEnv>();

// --- CORS ---
base.use(
  "/api/*",
  cors({
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    origin: (origin, ctx) => {
      // oxlint-disable-next-line no-unsafe-type-assertion -- Hono ctx.env is typed as any by cors middleware
      const env = ctx.env as Bindings;
      const allowedOrigin = String(env.ALLOWED_ORIGIN ?? "");
      if (allowedOrigin === "") {
        return origin;
      }
      if (origin === allowedOrigin) {
        return origin;
      }
      return "";
    },
  }),
);

// --- DI middleware ---
base.use("/api/*", async (ctx, next) => {
  ctx.set("deps", createDeps(ctx.env));
  await next();
});

// --- Auth middleware (articles and tags require session) ---
base.use("/api/articles/*", sessionAuth);
base.use("/api/tags/*", sessionAuth);

// --- Mount routes (chained for Hono RPC type inference) ---
const app = base
  .route("/", healthRoutes)
  .route("/", authRoutes)
  .route("/", articleRoutes)
  .route("/", tagRoutes);

// --- OpenAPI spec endpoint ---
app.doc("/api/doc", {
  info: {
    title: "Web Clipper API",
    version: "1.0.0",
  },
  openapi: "3.0.0",
});

// --- Scalar API Reference UI ---
// oxlint-disable-next-line new-cap -- Scalar is a third-party factory function using PascalCase
app.get("/api/reference", Scalar({ url: "/api/doc" }));

type AppType = typeof app;

// oxlint-disable-next-line import/no-default-export -- Required by Cloudflare Workers runtime
export { app as default };
export type { AppType };
