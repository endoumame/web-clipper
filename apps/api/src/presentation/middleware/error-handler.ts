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

const toMessage = (error: DomainError): string => {
  switch (error.type) {
    case "INVALID_URL":
    case "INVALID_TAG_NAME":
    case "INVALID_ARTICLE_ID":
    case "INVALID_USER_ID":
    case "INVALID_SESSION_ID":
    case "INVALID_CREDENTIALS":
    case "SESSION_NOT_FOUND":
    case "SESSION_EXPIRED":
    case "SETUP_ALREADY_COMPLETED":
    case "OAUTH_ERROR":
      return error.message;
    case "ARTICLE_NOT_FOUND":
      return `Article not found: ${error.id}`;
    case "TAG_NOT_FOUND":
      return `Tag not found: ${error.id}`;
    case "ARTICLE_ALREADY_EXISTS":
      return `Article already exists: ${error.url}`;
    case "TAG_ALREADY_EXISTS":
      return `Tag already exists: ${error.name}`;
    case "METADATA_FETCH_FAILED":
      return `Failed to fetch metadata from ${error.url}: ${error.cause}`;
    case "SUMMARY_GENERATION_FAILED":
      return `AI summary generation failed: ${error.cause}`;
    case "STORAGE_ERROR": {
      const cause = error.cause instanceof Error ? error.cause.message : String(error.cause);
      return `Internal storage error: ${cause}`;
    }
  }
};

export const domainErrorToResponse = (error: DomainError) => ({
  error: error.type,
  message: toMessage(error),
});
