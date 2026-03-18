import type { InferSelectModel } from "drizzle-orm";
import { UserIdVO, type User } from "../../domain/user/index.js";
import type { users } from "./schema.js";

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
