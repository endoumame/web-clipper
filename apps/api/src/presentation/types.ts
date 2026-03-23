import type { DrizzleD1Database } from "drizzle-orm/d1";
import type {
  ArticleRepository,
  MetadataFetcher,
  ArticleSummarizer,
} from "../domain/article/index.js";
import type { UserRepository, PasswordHasher } from "../domain/user/index.js";
import type { TagRepository } from "../domain/tag/index.js";
import type { SessionRepository } from "../domain/session/index.js";
import type { GitHubOAuthClient } from "../infrastructure/services/github-oauth-client.js";
import type { ArticleQueryService } from "../application/queries/article-query-service.js";
import type { TagQueryService } from "../application/queries/tag-query-service.js";

export type Deps = {
  readonly articleRepo: ArticleRepository;
  readonly metadataFetcher: MetadataFetcher;
  readonly summarizer: ArticleSummarizer;
  readonly userRepo: UserRepository;
  readonly sessionRepo: SessionRepository;
  readonly passwordHasher: PasswordHasher;
  readonly tagRepo: TagRepository;
  readonly githubOAuth: GitHubOAuthClient;
  readonly articleQuery: ArticleQueryService;
  readonly tagQuery: TagQueryService;
  readonly db: DrizzleD1Database;
};

export type Bindings = {
  DB: D1Database;
  AI: Ai;
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
