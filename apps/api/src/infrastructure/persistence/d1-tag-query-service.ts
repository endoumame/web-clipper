import { articleTags, tags } from "./schema.js";
import { eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { TagQueryService } from "../../application/queries/tag-query-service.js";

const createService = (db: DrizzleD1Database): TagQueryService => ({
  list: async (): Promise<
    { articleCount: number; createdAt: Date; id: string; name: string }[]
  > => {
    const rows = await db
      .select({
        articleCount: sql<number>`count(${articleTags.tagId})`,
        createdAt: tags.createdAt,
        id: tags.id,
        name: tags.name,
      })
      .from(tags)
      .leftJoin(articleTags, eq(tags.id, articleTags.tagId))
      .groupBy(tags.id)
      .orderBy(tags.name)
      .all();

    return rows;
  },
});

export { createService as createD1TagQueryService };
