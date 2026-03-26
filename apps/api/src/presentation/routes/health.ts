import { Hono } from "hono";

const healthRoutes = new Hono()
  .get("/health", (ctx) => ctx.json({ status: "ok" }))
  .get("/robots.txt", (ctx) => ctx.text("User-agent: *\nDisallow: /\n"));

export { healthRoutes };
