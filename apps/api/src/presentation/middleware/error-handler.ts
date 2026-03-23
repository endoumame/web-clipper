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

export const domainErrorToResponse = (error: DomainError) => ({
  error: error.type,
  message:
    "message" in error
      ? error.message
      : "cause" in error && error.type === "SUMMARY_GENERATION_FAILED"
        ? `Summary generation failed: ${error.cause}`
        : "url" in error
          ? `Failed to fetch: ${error.url}`
          : "id" in error
            ? `Not found: ${error.id}`
            : "name" in error
              ? `Already exists: ${error.name}`
              : "Unknown error",
});
