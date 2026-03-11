import type { DomainError } from "../../domain/errors.js";

export const domainErrorToStatus = (error: DomainError): number => {
  switch (error.type) {
    case "ARTICLE_NOT_FOUND":
    case "TAG_NOT_FOUND":
      return 404;
    case "ARTICLE_ALREADY_EXISTS":
    case "TAG_ALREADY_EXISTS":
      return 409;
    case "SETUP_ALREADY_COMPLETED":
      return 409;
    case "INVALID_URL":
    case "INVALID_TAG_NAME":
    case "INVALID_ARTICLE_ID":
      return 400;
    case "INVALID_CREDENTIALS":
    case "SESSION_NOT_FOUND":
    case "SESSION_EXPIRED":
      return 401;
    case "METADATA_FETCH_FAILED":
      return 502;
    case "OAUTH_ERROR":
      return 401;
    case "STORAGE_ERROR":
      return 500;
  }
};

export const domainErrorToResponse = (error: DomainError) => ({
  error: error.type,
  message:
    "message" in error
      ? error.message
      : "url" in error
        ? `Failed to fetch: ${error.url}`
        : "id" in error
          ? `Not found: ${error.id}`
          : "name" in error
            ? `Already exists: ${error.name}`
            : "Unknown error",
});
