import type {
  ArticleDetail,
  ArticleQueryService,
  ListArticlesParams,
  ListArticlesResult,
} from "../../application/queries/article-query-service.js";
import { and, desc, eq, like, lt } from "drizzle-orm";
import { articleTags, articles, tags } from "./schema.js";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { SourceVO } from "../../domain/article/index.js";

const DEFAULT_LIMIT = 20;
const EXTRA_FETCH = 1;
const EMPTY_LENGTH = 0;
const LAST_INDEX_OFFSET = 1;

const articleColumns = {
  createdAt: articles.createdAt,
  description: articles.description,
  id: articles.id,
  isRead: articles.isRead,
  ogImageUrl: articles.ogImageUrl,
  source: articles.source,
  title: articles.title,
  url: articles.url,
} as const;

interface ArticleListRow {
  readonly createdAt: Date;
  readonly description: string | null;
  readonly id: string;
  readonly isRead: boolean;
  readonly ogImageUrl: string | null;
  readonly source: string;
  readonly title: string;
  readonly url: string;
}

const hasValue = (val: string | null | undefined): val is string =>
  typeof val === "string" && val !== "";

interface TagQueryParams {
  readonly conditions: ReturnType<typeof eq>[];
  readonly db: DrizzleD1Database;
  readonly limit: number;
  readonly tagName: string;
}

const buildConditions = (params: ListArticlesParams): ReturnType<typeof eq>[] => {
  const conditions: ReturnType<typeof eq>[] = [];
  if (hasValue(params.source)) {
    conditions.push(eq(articles.source, params.source));
  }
  if (params.isRead !== null && typeof params.isRead === "boolean") {
    conditions.push(eq(articles.isRead, params.isRead));
  }
  if (hasValue(params.search)) {
    conditions.push(like(articles.title, `%${params.search}%`));
  }
  return conditions;
};

const addCursorCondition = async (
  db: DrizzleD1Database,
  params: ListArticlesParams,
  conditions: ReturnType<typeof eq>[],
): Promise<void> => {
  if (hasValue(params.cursor)) {
    const cursorArticle = await db
      .select({ createdAt: articles.createdAt })
      .from(articles)
      .where(eq(articles.id, params.cursor))
      .get();
    if (cursorArticle) {
      conditions.push(lt(articles.createdAt, cursorArticle.createdAt));
    }
  }
};

const fetchRowsWithTagQuery = async (params: TagQueryParams): Promise<ArticleListRow[]> => {
  const result = await params.db
    .select(articleColumns)
    .from(articles)
    .innerJoin(articleTags, eq(articles.id, articleTags.articleId))
    .innerJoin(tags, eq(articleTags.tagId, tags.id))
    .where(and(eq(tags.name, params.tagName), ...params.conditions))
    .orderBy(desc(articles.createdAt))
    .limit(params.limit + EXTRA_FETCH)
    .all();
  return result;
};

const fetchRowsWithoutTagQueryFiltered = async (
  db: DrizzleD1Database,
  conditions: ReturnType<typeof eq>[],
  limit: number,
): Promise<ArticleListRow[]> => {
  const result = await db
    .select(articleColumns)
    .from(articles)
    .where(and(...conditions))
    .orderBy(desc(articles.createdAt))
    .limit(limit + EXTRA_FETCH)
    .all();
  return result;
};

const fetchRowsWithoutTagQueryAll = async (
  db: DrizzleD1Database,
  limit: number,
): Promise<ArticleListRow[]> => {
  const result = await db
    .select(articleColumns)
    .from(articles)
    .orderBy(desc(articles.createdAt))
    .limit(limit + EXTRA_FETCH)
    .all();
  return result;
};

const fetchRowsWithoutTagQuery = async (
  db: DrizzleD1Database,
  conditions: ReturnType<typeof eq>[],
  limit: number,
): Promise<ArticleListRow[]> => {
  if (conditions.length > EMPTY_LENGTH) {
    const result = await fetchRowsWithoutTagQueryFiltered(db, conditions, limit);
    return result;
  }
  const result = await fetchRowsWithoutTagQueryAll(db, limit);
  return result;
};

const parseSource = (source: string): ReturnType<typeof SourceVO.schema.parse> =>
  SourceVO.schema.parse(source);

const buildResult = (rows: ArticleListRow[], limit: number): ListArticlesResult => {
  const hasNext = rows.length > limit;
  let items: ArticleListRow[] = rows;
  if (hasNext) {
    items = rows.slice(EMPTY_LENGTH, limit);
  }
  let nextCursor: string | null = null;
  if (hasNext) {
    nextCursor = items.at(items.length - LAST_INDEX_OFFSET)?.id ?? null;
  }
  return {
    articles: items.map((item) => ({ ...item, source: parseSource(item.source) })),
    nextCursor,
  };
};

const createService = (db: DrizzleD1Database): ArticleQueryService => ({
  getById: async (id: string): Promise<ArticleDetail | null> => {
    const row = await db.select().from(articles).where(eq(articles.id, id)).get();
    if (!row) {
      return null;
    }

    const tagRows = await db
      .select({ name: tags.name })
      .from(articleTags)
      .innerJoin(tags, eq(articleTags.tagId, tags.id))
      .where(eq(articleTags.articleId, id))
      .all();

    return {
      ...row,
      source: parseSource(row.source),
      tags: tagRows.map((tag) => tag.name),
    };
  },

  list: async (params: ListArticlesParams): Promise<ListArticlesResult> => {
    const limit = params.limit ?? DEFAULT_LIMIT;
    const conditions = buildConditions(params);
    await addCursorCondition(db, params, conditions);

    const rows = hasValue(params.tagName)
      ? await fetchRowsWithTagQuery({
          conditions,
          db,
          limit,
          tagName: params.tagName,
        })
      : await fetchRowsWithoutTagQuery(db, conditions, limit);
    return buildResult(rows, limit);
  },
});

export { createService as createD1ArticleQueryService };
