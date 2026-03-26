import type { UserId } from "./user-id.js";

interface User {
  readonly id: UserId;
  readonly username: string;
  readonly passwordHash: string;
  readonly passwordSalt: string;
  readonly githubId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface CreateParams {
  readonly id: UserId;
  readonly username: string;
  readonly passwordHash: string;
  readonly passwordSalt: string;
  readonly githubId?: string | null;
}

const create = (params: CreateParams): User => ({
  createdAt: new Date(),
  githubId: params.githubId ?? null,
  id: params.id,
  passwordHash: params.passwordHash,
  passwordSalt: params.passwordSalt,
  updatedAt: new Date(),
  username: params.username,
});

const linkGitHub = (user: User, githubId: string): User => ({
  ...user,
  githubId,
  updatedAt: new Date(),
});

const UserEntity = {
  create,
  linkGitHub,
} as const;

export { UserEntity };
export type { User };
