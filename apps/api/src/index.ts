import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";
import type { AppEnv } from "./presentation/types.js";
import { createD1ArticleRepository } from "./infrastructure/persistence/d1-article-repository.js";
import { createFetchMetadataFetcher } from "./infrastructure/services/fetch-metadata-fetcher.js";
import { createD1UserRepository } from "./infrastructure/persistence/d1-user-repository.js";
import { createD1SessionRepository } from "./infrastructure/persistence/d1-session-repository.js";
import { createWebCryptoPasswordHasher } from "./infrastructure/services/web-crypto-password-hasher.js";
import { sessionAuth } from "./presentation/middleware/auth.js";
import { healthRoutes } from "./presentation/routes/health.js";
import { authRoutes } from "./presentation/routes/auth.js";
import { articleRoutes } from "./presentation/routes/articles.js";
import { tagRoutes } from "./presentation/routes/tags.js";

const base = new OpenAPIHono<AppEnv>();

// --- CORS ---
base.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const allowed = c.env.ALLOWED_ORIGIN;
      if (!allowed) return origin;
      return origin === allowed ? origin : "";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    credentials: true,
  }),
);

// --- DI middleware ---
base.use("/api/*", async (c, next) => {
  const db = drizzle(c.env.DB);
  c.set("deps", {
    articleRepo: createD1ArticleRepository(db),
    metadataFetcher: createFetchMetadataFetcher(),
    userRepo: createD1UserRepository(db),
    sessionRepo: createD1SessionRepository(db),
    passwordHasher: createWebCryptoPasswordHasher(),
    db,
  });
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
  openapi: "3.0.0",
  info: {
    title: "Web Clipper API",
    version: "1.0.0",
  },
});

// --- Scalar API Reference UI ---
app.get("/api/reference", Scalar({ url: "/api/doc" }));

export type AppType = typeof app;
export default app;
