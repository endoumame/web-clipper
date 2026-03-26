import type { DomainError } from "../../domain/shared/index.js";

const STATUS_MAP = {
  ARTICLE_ALREADY_EXISTS: 409,
  ARTICLE_NOT_FOUND: 404,
  INVALID_ARTICLE_ID: 400,
  INVALID_CREDENTIALS: 401,
  INVALID_SESSION_ID: 400,
  INVALID_TAG_NAME: 400,
  INVALID_URL: 400,
  INVALID_USER_ID: 400,
  METADATA_FETCH_FAILED: 502,
  OAUTH_ERROR: 401,
  SESSION_EXPIRED: 401,
  SESSION_NOT_FOUND: 401,
  SETUP_ALREADY_COMPLETED: 409,
  STORAGE_ERROR: 500,
  SUMMARY_GENERATION_FAILED: 502,
  TAG_ALREADY_EXISTS: 409,
  TAG_NOT_FOUND: 404,
} as const satisfies Record<DomainError["type"], number>;

type DomainStatusCode = (typeof STATUS_MAP)[DomainError["type"]];

const domainErrorToStatus = <StatusCode extends DomainStatusCode>(error: DomainError): StatusCode =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Hono requires exact status code literals; centralizing the only unavoidable cast here
  STATUS_MAP[error.type] as StatusCode;

const toMessageWithCause = (error: DomainError): string => {
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
    case "METADATA_FETCH_FAILED":
    case "STORAGE_ERROR":
    case "SUMMARY_GENERATION_FAILED": {
      return "";
    }
    case "ARTICLE_NOT_FOUND": {
      return `Article not found: ${error.id}`;
    }
    case "TAG_NOT_FOUND": {
      return `Tag not found: ${error.id}`;
    }
    case "ARTICLE_ALREADY_EXISTS": {
      return `Article already exists: ${error.url}`;
    }
    case "TAG_ALREADY_EXISTS": {
      return `Tag already exists: ${error.name}`;
    }
    default: {
      return "";
    }
  }
};

const getStorageErrorCause = (cause: unknown): string => {
  if (cause instanceof Error) {
    return cause.message;
  }
  return String(cause);
};

const toMessageForErrorTypes = (error: DomainError): string => {
  switch (error.type) {
    case "METADATA_FETCH_FAILED": {
      return `Failed to fetch metadata from ${error.url}: ${error.cause}`;
    }
    case "SUMMARY_GENERATION_FAILED": {
      return `AI summary generation failed: ${error.cause}`;
    }
    case "STORAGE_ERROR": {
      return `Internal storage error: ${getStorageErrorCause(error.cause)}`;
    }
    case "INVALID_URL":
    case "INVALID_TAG_NAME":
    case "INVALID_ARTICLE_ID":
    case "INVALID_USER_ID":
    case "INVALID_SESSION_ID":
    case "INVALID_CREDENTIALS":
    case "SESSION_NOT_FOUND":
    case "SESSION_EXPIRED":
    case "SETUP_ALREADY_COMPLETED":
    case "OAUTH_ERROR": {
      return error.message;
    }
    case "ARTICLE_NOT_FOUND":
    case "TAG_NOT_FOUND":
    case "ARTICLE_ALREADY_EXISTS":
    case "TAG_ALREADY_EXISTS": {
      return "Unknown error";
    }
    default: {
      return "Unknown error";
    }
  }
};

const toMessage = (error: DomainError): string => {
  const causeMessage = toMessageWithCause(error);
  if (causeMessage !== "") {
    return causeMessage;
  }
  return toMessageForErrorTypes(error);
};

const domainErrorToResponse = (error: DomainError): { error: string; message: string } => ({
  error: error.type,
  message: toMessage(error),
});

export { domainErrorToResponse, domainErrorToStatus };
