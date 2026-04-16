import type { DomainError } from "../../domain/shared/index.js";

const STATUS_MAP = {
  ARTICLE_ALREADY_EXISTS: 409,
  ARTICLE_NOT_FOUND: 404,
  CONTENT_NOT_AVAILABLE: 400,
  HIGHLIGHT_NOT_FOUND: 404,
  INVALID_ARTICLE_ID: 400,
  INVALID_CREDENTIALS: 401,
  INVALID_HIGHLIGHT_ID: 400,
  INVALID_SESSION_ID: 400,
  INVALID_TAG_ID: 400,
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
  TAG_SUGGESTION_FAILED: 502,
} as const satisfies Record<DomainError["type"], number>;

type DomainStatusCode = (typeof STATUS_MAP)[DomainError["type"]];

const domainErrorToStatus = <StatusCode extends DomainStatusCode>(error: DomainError): StatusCode =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Hono requires exact status code literals; centralizing the only unavoidable cast here
  STATUS_MAP[error.type] as StatusCode;

const isNotFoundError = (
  error: DomainError,
): error is Extract<
  DomainError,
  { type: "ARTICLE_NOT_FOUND" | "HIGHLIGHT_NOT_FOUND" | "TAG_NOT_FOUND" }
> =>
  error.type === "ARTICLE_NOT_FOUND" ||
  error.type === "HIGHLIGHT_NOT_FOUND" ||
  error.type === "TAG_NOT_FOUND";

const toMessageWithCause = (error: DomainError): string => {
  if (isNotFoundError(error)) {
    return `${error.type.replaceAll("_", " ").toLowerCase()}: ${error.id}`;
  }
  if (error.type === "CONTENT_NOT_AVAILABLE") {
    return `Content not available for article: ${error.articleId}`;
  }
  if (error.type === "ARTICLE_ALREADY_EXISTS") {
    return `Article already exists: ${error.url}`;
  }
  if (error.type === "TAG_ALREADY_EXISTS") {
    return `Tag already exists: ${error.name}`;
  }
  return "";
};

const getStorageErrorCause = (cause: unknown): string => {
  if (cause instanceof Error) {
    return cause.message;
  }
  return String(cause);
};

const hasMessageField = (error: DomainError): error is Extract<DomainError, { message: string }> =>
  "message" in error;

const formatCauseError = (error: DomainError): string | null => {
  if (error.type === "METADATA_FETCH_FAILED") {
    return `Failed to fetch metadata from ${error.url}: ${error.cause}`;
  }
  if (error.type === "SUMMARY_GENERATION_FAILED") {
    return `AI summary generation failed: ${error.cause}`;
  }
  if (error.type === "TAG_SUGGESTION_FAILED") {
    return `AI tag suggestion failed: ${error.cause}`;
  }
  if (error.type === "STORAGE_ERROR") {
    return `Internal storage error: ${getStorageErrorCause(error.cause)}`;
  }
  return null;
};

const toMessageForErrorTypes = (error: DomainError): string => {
  const causeError = formatCauseError(error);
  if (causeError !== null) {
    return causeError;
  }
  return hasMessageField(error) ? error.message : "Unknown error";
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
