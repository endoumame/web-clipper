import type {
  ArticleRepository,
  ArticleSummarizer,
  ContentExtractor,
  MetadataFetcher,
} from "../domain/article/index.js";
import type { PasswordHasher, UserRepository } from "../domain/user/index.js";
import type { TagRepository, TagSuggester } from "../domain/tag/index.js";
import type { ArticleQueryService } from "../application/queries/article-query-service.js";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { GitHubOAuthClient } from "../infrastructure/services/github-oauth-client.js";
import type { HighlightQueryService } from "../application/queries/highlight-query-service.js";
import type { HighlightRepository } from "../domain/highlight/index.js";
import type { SessionRepository } from "../domain/session/index.js";
import type { TagQueryService } from "../application/queries/tag-query-service.js";

interface Deps {
  readonly articleQuery: ArticleQueryService;
  readonly articleRepo: ArticleRepository;
  readonly contentExtractor: ContentExtractor;
  readonly db: DrizzleD1Database;
  readonly githubOAuth: GitHubOAuthClient;
  readonly highlightQuery: HighlightQueryService;
  readonly highlightRepo: HighlightRepository;
  readonly metadataFetcher: MetadataFetcher;
  readonly passwordHasher: PasswordHasher;
  readonly sessionRepo: SessionRepository;
  readonly summarizer: ArticleSummarizer;
  readonly tagQuery: TagQueryService;
  readonly tagRepo: TagRepository;
  readonly tagSuggester: TagSuggester;
  readonly userRepo: UserRepository;
}

interface Bindings {
  AI: Ai;
  ALLOWED_ORIGIN: string;
  DB: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

interface AppEnv {
  Bindings: Bindings;
  Variables: {
    deps: Deps;
  };
}

export type { AppEnv, Bindings, Deps };
