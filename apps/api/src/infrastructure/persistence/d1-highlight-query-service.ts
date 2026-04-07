import type {
  HighlightDetail,
  HighlightQueryService,
} from "../../application/queries/highlight-query-service.js";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { highlights } from "./schema.js";

const createService = (db: DrizzleD1Database): HighlightQueryService => ({
  listByArticleId: async (articleId: string): Promise<readonly HighlightDetail[]> => {
    const rows = await db
      .select()
      .from(highlights)
      .where(eq(highlights.articleId, articleId))
      .all();
    return rows;
  },
});

export { createService as createD1HighlightQueryService };
