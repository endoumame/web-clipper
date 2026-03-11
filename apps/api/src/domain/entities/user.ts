import type { UserId } from "../values/user-id.js";

export type User = {
  readonly id: UserId;
  readonly username: string;
  readonly passwordHash: string;
  readonly passwordSalt: string;
  readonly githubId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

type CreateParams = {
  readonly id: UserId;
  readonly username: string;
  readonly passwordHash: string;
  readonly passwordSalt: string;
  readonly githubId?: string | null;
};

const create = (params: CreateParams): User => ({
  id: params.id,
  username: params.username,
  passwordHash: params.passwordHash,
  passwordSalt: params.passwordSalt,
  githubId: params.githubId ?? null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const linkGitHub = (user: User, githubId: string): User => ({
  ...user,
  githubId,
  updatedAt: new Date(),
});

export const UserEntity = {
  create,
  linkGitHub,
} as const;
