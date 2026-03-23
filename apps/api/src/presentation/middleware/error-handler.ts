import type { DomainError } from "../../domain/shared/index.js";

const STATUS_MAP = {
  ARTICLE_NOT_FOUND: 404,
  TAG_NOT_FOUND: 404,
  ARTICLE_ALREADY_EXISTS: 409,
  TAG_ALREADY_EXISTS: 409,
  SETUP_ALREADY_COMPLETED: 409,
  INVALID_URL: 400,
  INVALID_TAG_NAME: 400,
  INVALID_ARTICLE_ID: 400,
  INVALID_USER_ID: 400,
  INVALID_SESSION_ID: 400,
  INVALID_CREDENTIALS: 401,
  SESSION_NOT_FOUND: 401,
  SESSION_EXPIRED: 401,
  METADATA_FETCH_FAILED: 502,
  SUMMARY_GENERATION_FAILED: 502,
  OAUTH_ERROR: 401,
  STORAGE_ERROR: 500,
} as const satisfies Record<DomainError["type"], number>;

type DomainStatusCode = (typeof STATUS_MAP)[DomainError["type"]];

export const domainErrorToStatus = <S extends DomainStatusCode>(error: DomainError): S =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Hono requires exact status code literals; centralizing the only unavoidable cast here
  STATUS_MAP[error.type] as S;

const MESSAGE_MAP: Record<DomainError["type"], (error: DomainError & { type: string }) => string> =
  {
    INVALID_URL: (e) => (e as Extract<DomainError, { type: "INVALID_URL" }>).message,
    INVALID_TAG_NAME: (e) => (e as Extract<DomainError, { type: "INVALID_TAG_NAME" }>).message,
    INVALID_ARTICLE_ID: (e) => (e as Extract<DomainError, { type: "INVALID_ARTICLE_ID" }>).message,
    INVALID_USER_ID: (e) => (e as Extract<DomainError, { type: "INVALID_USER_ID" }>).message,
    INVALID_SESSION_ID: (e) => (e as Extract<DomainError, { type: "INVALID_SESSION_ID" }>).message,
    INVALID_CREDENTIALS: (e) =>
      (e as Extract<DomainError, { type: "INVALID_CREDENTIALS" }>).message,
    SESSION_NOT_FOUND: (e) => (e as Extract<DomainError, { type: "SESSION_NOT_FOUND" }>).message,
    SESSION_EXPIRED: (e) => (e as Extract<DomainError, { type: "SESSION_EXPIRED" }>).message,
    SETUP_ALREADY_COMPLETED: (e) =>
      (e as Extract<DomainError, { type: "SETUP_ALREADY_COMPLETED" }>).message,
    OAUTH_ERROR: (e) => (e as Extract<DomainError, { type: "OAUTH_ERROR" }>).message,
    ARTICLE_NOT_FOUND: (e) => {
      const err = e as Extract<DomainError, { type: "ARTICLE_NOT_FOUND" }>;
      return `Article not found: ${err.id}`;
    },
    TAG_NOT_FOUND: (e) => {
      const err = e as Extract<DomainError, { type: "TAG_NOT_FOUND" }>;
      return `Tag not found: ${err.id}`;
    },
    ARTICLE_ALREADY_EXISTS: (e) => {
      const err = e as Extract<DomainError, { type: "ARTICLE_ALREADY_EXISTS" }>;
      return `Article already exists: ${err.url}`;
    },
    TAG_ALREADY_EXISTS: (e) => {
      const err = e as Extract<DomainError, { type: "TAG_ALREADY_EXISTS" }>;
      return `Tag already exists: ${err.name}`;
    },
    METADATA_FETCH_FAILED: (e) => {
      const err = e as Extract<DomainError, { type: "METADATA_FETCH_FAILED" }>;
      return `Failed to fetch metadata from ${err.url}: ${err.cause}`;
    },
    SUMMARY_GENERATION_FAILED: (e) => {
      const err = e as Extract<DomainError, { type: "SUMMARY_GENERATION_FAILED" }>;
      return `AI summary generation failed: ${err.cause}`;
    },
    STORAGE_ERROR: (e) => {
      const err = e as Extract<DomainError, { type: "STORAGE_ERROR" }>;
      const cause = err.cause instanceof Error ? err.cause.message : String(err.cause);
      return `Internal storage error: ${cause}`;
    },
  };

export const domainErrorToResponse = (error: DomainError) => ({
  error: error.type,
  message: MESSAGE_MAP[error.type](error),
});
