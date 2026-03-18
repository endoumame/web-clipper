import { desc, eq, like, and, lt } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type {
  ArticleQueryService,
  ListArticlesParams,
  ListArticlesResult,
  ArticleDetail,
} from "../../application/queries/article-query-service.js";
import { articles, tags, articleTags } from "./schema.js";

const articleColumns = {
  id: articles.id,
  url: articles.url,
  title: articles.title,
  description: articles.description,
  source: articles.source,
  ogImageUrl: articles.ogImageUrl,
  isRead: articles.isRead,
  createdAt: articles.createdAt,
} as const;

export const createD1ArticleQueryService = (db: DrizzleD1Database): ArticleQueryService => ({
  list: async (params: ListArticlesParams): Promise<ListArticlesResult> => {
    const limit = params.limit ?? 20;

    const conditions = [];
    if (params.source) conditions.push(eq(articles.source, params.source));
    if (params.isRead !== undefined) conditions.push(eq(articles.isRead, params.isRead));
    if (params.search) conditions.push(like(articles.title, `%${params.search}%`));

    if (params.cursor) {
      const cursorArticle = await db
        .select({ createdAt: articles.createdAt })
        .from(articles)
        .where(eq(articles.id, params.cursor))
        .get();
      if (cursorArticle) {
        conditions.push(lt(articles.createdAt, cursorArticle.createdAt));
      }
    }

    let query;
    if (params.tagName) {
      query = db
        .select(articleColumns)
        .from(articles)
        .innerJoin(articleTags, eq(articles.id, articleTags.articleId))
        .innerJoin(tags, eq(articleTags.tagId, tags.id))
        .where(and(eq(tags.name, params.tagName), ...conditions))
        .orderBy(desc(articles.createdAt))
        .limit(limit + 1);
    } else {
      query = db
        .select(articleColumns)
        .from(articles)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(articles.createdAt))
        .limit(limit + 1);
    }

    const rows = await query.all();
    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;

    return {
      articles: items,
      nextCursor: hasNext ? items[items.length - 1].id : null,
    };
  },

  getById: async (id: string): Promise<ArticleDetail | null> => {
    const row = await db.select().from(articles).where(eq(articles.id, id)).get();
    if (!row) return null;

    const tagRows = await db
      .select({ name: tags.name })
      .from(articleTags)
      .innerJoin(tags, eq(articleTags.tagId, tags.id))
      .where(eq(articleTags.articleId, id))
      .all();

    return {
      ...row,
      tags: tagRows.map((t) => t.name),
    };
  },
});
