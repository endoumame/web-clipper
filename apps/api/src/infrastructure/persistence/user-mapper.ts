import type { InferSelectModel } from "drizzle-orm";
import type { User } from "../../domain/user/index.js";
import { UserIdVO } from "../../domain/user/index.js";
import type { users } from "./schema.js";

type UserRow = InferSelectModel<typeof users>;

const userToDomain = (row: UserRow): User => ({
  createdAt: row.createdAt,
  githubId: row.githubId,
  id: UserIdVO.schema.parse(row.id),
  passwordHash: row.passwordHash,
  passwordSalt: row.passwordSalt,
  updatedAt: row.updatedAt,
  username: row.username,
});

const userToPersistence = (
  user: User,
): Omit<UserRow, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
} => ({
  createdAt: user.createdAt,
  githubId: user.githubId,
  id: user.id,
  passwordHash: user.passwordHash,
  passwordSalt: user.passwordSalt,
  updatedAt: user.updatedAt,
  username: user.username,
});

export { userToDomain, userToPersistence };
