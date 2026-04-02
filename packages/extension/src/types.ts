interface PageInfo {
  readonly description: string;
  readonly ogImage: string;
  readonly selectedText: string;
  readonly title: string;
  readonly url: string;
}

interface ExtensionMessage {
  readonly type: "GET_PAGE_INFO";
}

interface ClipResult {
  readonly error?: string;
  readonly success: boolean;
}

export type { ClipResult, ExtensionMessage, PageInfo };
