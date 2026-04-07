// oxlint-disable import/max-dependencies -- DI factory necessarily imports all dependencies
import type { Bindings, Deps } from "../presentation/types.js";
import { createD1ArticleQueryService } from "./persistence/d1-article-query-service.js";
import { createD1ArticleRepository } from "./persistence/d1-article-repository.js";
import { createD1HighlightQueryService } from "./persistence/d1-highlight-query-service.js";
import { createD1HighlightRepository } from "./persistence/d1-highlight-repository.js";
import { createD1SessionRepository } from "./persistence/d1-session-repository.js";
import { createD1TagQueryService } from "./persistence/d1-tag-query-service.js";
import { createD1TagRepository } from "./persistence/d1-tag-repository.js";
import { createD1UserRepository } from "./persistence/d1-user-repository.js";
import { createFetchMetadataFetcher } from "./services/fetch-metadata-fetcher.js";
import { createGitHubOAuthClient } from "./services/github-oauth-client.js";
import { createReadabilityContentExtractor } from "./services/readability-content-extractor.js";
import { createWebCryptoPasswordHasher } from "./services/web-crypto-password-hasher.js";
import { createWorkersAiSummarizer } from "./services/workers-ai-summarizer.js";
import { createWorkersAiTagSuggester } from "./services/workers-ai-tag-suggester.js";
import { drizzle } from "drizzle-orm/d1";

const createDeps = (env: Bindings): Deps => {
  const db = drizzle(env.DB);
  return {
    articleQuery: createD1ArticleQueryService(db),
    articleRepo: createD1ArticleRepository(db),
    contentExtractor: createReadabilityContentExtractor(),
    db,
    githubOAuth: createGitHubOAuthClient(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET),
    highlightQuery: createD1HighlightQueryService(db),
    highlightRepo: createD1HighlightRepository(db),
    metadataFetcher: createFetchMetadataFetcher(),
    passwordHasher: createWebCryptoPasswordHasher(),
    sessionRepo: createD1SessionRepository(db),
    summarizer: createWorkersAiSummarizer(env.AI),
    tagQuery: createD1TagQueryService(db),
    tagRepo: createD1TagRepository(db),
    tagSuggester: createWorkersAiTagSuggester(env.AI),
    userRepo: createD1UserRepository(db),
  };
};

export { createDeps };
