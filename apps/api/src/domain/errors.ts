export type DomainError =
  | { readonly type: "INVALID_URL"; readonly message: string }
  | { readonly type: "INVALID_TAG_NAME"; readonly message: string }
  | { readonly type: "INVALID_ARTICLE_ID"; readonly message: string }
  | { readonly type: "ARTICLE_NOT_FOUND"; readonly id: string }
  | { readonly type: "ARTICLE_ALREADY_EXISTS"; readonly url: string }
  | { readonly type: "TAG_NOT_FOUND"; readonly id: string }
  | { readonly type: "TAG_ALREADY_EXISTS"; readonly name: string }
  | {
      readonly type: "METADATA_FETCH_FAILED";
      readonly url: string;
      readonly cause: string;
    }
  | { readonly type: "STORAGE_ERROR"; readonly cause: unknown }
  | { readonly type: "INVALID_CREDENTIALS"; readonly message: string }
  | { readonly type: "SESSION_NOT_FOUND"; readonly message: string }
  | { readonly type: "SESSION_EXPIRED"; readonly message: string }
  | { readonly type: "SETUP_ALREADY_COMPLETED"; readonly message: string }
  | { readonly type: "OAUTH_ERROR"; readonly message: string };
