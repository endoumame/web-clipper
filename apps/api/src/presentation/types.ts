import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { ArticleRepository, MetadataFetcher } from "../domain/article/index.js";
import type { UserRepository, PasswordHasher } from "../domain/user/index.js";
import type { TagRepository } from "../domain/tag/index.js";
import type { SessionRepository } from "../domain/session/index.js";

export type Deps = {
  readonly articleRepo: ArticleRepository;
  readonly metadataFetcher: MetadataFetcher;
  readonly userRepo: UserRepository;
  readonly sessionRepo: SessionRepository;
  readonly passwordHasher: PasswordHasher;
  readonly tagRepo: TagRepository;
  readonly db: DrizzleD1Database;
};

export type Bindings = {
  DB: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  ALLOWED_ORIGIN: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    deps: Deps;
  };
};
