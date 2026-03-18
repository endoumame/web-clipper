import { eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { TagQueryService } from "../../application/queries/tag-query-service.js";
import { tags, articleTags } from "./schema.js";

export const createD1TagQueryService = (db: DrizzleD1Database): TagQueryService => ({
  list: async () => {
    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        createdAt: tags.createdAt,
        articleCount: sql<number>`count(${articleTags.tagId})`,
      })
      .from(tags)
      .leftJoin(articleTags, eq(tags.id, articleTags.tagId))
      .groupBy(tags.id)
      .orderBy(tags.name)
      .all();

    return rows;
  },
});
