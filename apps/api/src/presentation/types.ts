import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { ArticleRepository, MetadataFetcher, UserRepository, SessionRepository, PasswordHasher } from "../domain/ports/mod.js";

export type Deps = {
  readonly articleRepo: ArticleRepository;
  readonly metadataFetcher: MetadataFetcher;
  readonly userRepo: UserRepository;
  readonly sessionRepo: SessionRepository;
  readonly passwordHasher: PasswordHasher;
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
    currentUserId: string;
  };
};
