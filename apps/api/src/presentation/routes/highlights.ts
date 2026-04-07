import type { HTTP_BAD_REQUEST, HTTP_NOT_FOUND } from "../http-status.js";
import { HTTP_CREATED, HTTP_NO_CONTENT, HTTP_OK } from "../http-status.js";
import {
  createHighlight,
  deleteHighlight,
  updateHighlight,
} from "../../application/commands/index.js";
import {
  createHighlightRoute,
  deleteHighlightRoute,
  listHighlightsRoute,
  updateHighlightRoute,
} from "./highlight-route-defs.js";
import { domainErrorToResponse, domainErrorToStatus } from "../middleware/error-handler.js";
import type { AppEnv } from "../types.js";
import type { HighlightDetail } from "../../application/queries/highlight-query-service.js";
import { OpenAPIHono } from "@hono/zod-openapi";

const toHighlightResponse = (
  highlight: HighlightDetail,
): {
  articleId: string;
  color: string;
  createdAt: string;
  endOffset: number;
  highlightedText: string;
  id: string;
  note: string | null;
  prefixContext: string;
  startOffset: number;
  suffixContext: string;
  updatedAt: string;
} => ({
  articleId: highlight.articleId,
  color: highlight.color,
  createdAt: highlight.createdAt.toISOString(),
  endOffset: highlight.endOffset,
  highlightedText: highlight.highlightedText,
  id: highlight.id,
  note: highlight.note,
  prefixContext: highlight.prefixContext,
  startOffset: highlight.startOffset,
  suffixContext: highlight.suffixContext,
  updatedAt: highlight.updatedAt.toISOString(),
});

const highlightRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listHighlightsRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const { id } = ctx.req.valid("param");
    const items = await deps.highlightQuery.listByArticleId(id);
    return ctx.json({ highlights: items.map((item) => toHighlightResponse(item)) }, HTTP_OK);
  })
  .openapi(createHighlightRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const { id } = ctx.req.valid("param");
    const body = ctx.req.valid("json");
    const result = await createHighlight({
      articleRepo: deps.articleRepo,
      highlightRepo: deps.highlightRepo,
    })({ articleId: id, ...body });
    return result.match(
      (highlight) => ctx.json(toHighlightResponse(highlight), HTTP_CREATED),
      (error) =>
        ctx.json(
          domainErrorToResponse(error),
          domainErrorToStatus<typeof HTTP_BAD_REQUEST | typeof HTTP_NOT_FOUND>(error),
        ),
    );
  })
  .openapi(updateHighlightRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const { highlightId } = ctx.req.valid("param");
    const body = ctx.req.valid("json");
    const result = await updateHighlight({
      highlightRepo: deps.highlightRepo,
    })({ id: highlightId, ...body });
    return result.match(
      (highlight) => ctx.json(toHighlightResponse(highlight), HTTP_OK),
      (error) =>
        ctx.json(domainErrorToResponse(error), domainErrorToStatus<typeof HTTP_NOT_FOUND>(error)),
    );
  })
  .openapi(deleteHighlightRoute, async (ctx) => {
    const deps = ctx.get("deps");
    const { highlightId } = ctx.req.valid("param");
    const result = await deleteHighlight({
      highlightRepo: deps.highlightRepo,
    })(highlightId);
    return result.match(
      () => ctx.body(null, HTTP_NO_CONTENT),
      (error) =>
        ctx.json(domainErrorToResponse(error), domainErrorToStatus<typeof HTTP_NOT_FOUND>(error)),
    );
  });

export { highlightRoutes };
