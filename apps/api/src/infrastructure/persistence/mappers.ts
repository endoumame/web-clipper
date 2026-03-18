import type { InferSelectModel } from "drizzle-orm";
import {
  ArticleIdVO,
  ArticleUrlVO,
  SourceVO,
  ArticleEntity,
  type Article,
} from "../../domain/article/index.js";
import { TagNameVO } from "../../domain/tag/index.js";
import { UserIdVO, type User } from "../../domain/user/index.js";
import { SessionIdVO, type Session } from "../../domain/session/index.js";
import type { articles, users, sessions } from "./schema.js";

type ArticleRow = InferSelectModel<typeof articles>;

export const toDomain = (row: ArticleRow, tagNames: string[]): Article =>
  ArticleEntity.reconstruct({
    id: ArticleIdVO.schema.parse(row.id),
    url: ArticleUrlVO.schema.parse(row.url),
    title: row.title,
    description: row.description,
    source: SourceVO.schema.parse(row.source),
    ogImageUrl: row.ogImageUrl,
    memo: row.memo,
    isRead: row.isRead,
    tags: tagNames.map((name) => TagNameVO.schema.parse(name)),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

export const toPersistence = (
  article: Article,
): Omit<ArticleRow, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
} => ({
  id: article.id,
  url: article.url,
  title: article.title,
  description: article.description,
  source: article.source,
  ogImageUrl: article.ogImageUrl,
  memo: article.memo,
  isRead: article.isRead,
  createdAt: article.createdAt,
  updatedAt: article.updatedAt,
});

// ── User mappers ──

type UserRow = InferSelectModel<typeof users>;

export const userToDomain = (row: UserRow): User => ({
  id: UserIdVO.schema.parse(row.id),
  username: row.username,
  passwordHash: row.passwordHash,
  passwordSalt: row.passwordSalt,
  githubId: row.githubId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const userToPersistence = (
  user: User,
): Omit<UserRow, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
} => ({
  id: user.id,
  username: user.username,
  passwordHash: user.passwordHash,
  passwordSalt: user.passwordSalt,
  githubId: user.githubId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ── Session mappers ──

type SessionRow = InferSelectModel<typeof sessions>;

export const sessionToDomain = (row: SessionRow): Session => ({
  id: SessionIdVO.schema.parse(row.id),
  userId: UserIdVO.schema.parse(row.userId),
  expiresAt: row.expiresAt,
  createdAt: row.createdAt,
});

export const sessionToPersistence = (
  session: Session,
): Omit<SessionRow, "expiresAt" | "createdAt"> & {
  expiresAt: Date;
  createdAt: Date;
} => ({
  id: session.id,
  userId: session.userId,
  expiresAt: session.expiresAt,
  createdAt: session.createdAt,
});
