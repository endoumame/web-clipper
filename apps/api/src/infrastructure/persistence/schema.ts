import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

const articles = sqliteTable("articles", {
  aiSummary: text("ai_summary"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  description: text("description"),
  id: text("id").primaryKey(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  memo: text("memo"),
  ogImageUrl: text("og_image_url"),
  source: text("source").notNull(),
  title: text("title").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  url: text("url").notNull().unique(),
});

const tags = sqliteTable("tags", {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

const articleTags = sqliteTable(
  "article_tags",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.articleId, table.tagId] })],
);

const users = sqliteTable("users", {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  githubId: text("github_id").unique(),
  id: text("id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  username: text("username").notNull().unique(),
});

const sessions = sqliteTable("sessions", {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export { articles, articleTags, sessions, tags, users };
