/* oxlint-disable no-unsafe-member-access, no-unsafe-call, no-unsafe-assignment, no-unsafe-type-assertion, no-unsafe-argument -- Chrome extension API types not resolved by oxlint */

const CONTEXT_MENU_ID = "clip-page";
const STORAGE_KEYS = { apiUrl: "apiUrl", sessionId: "sessionId" } as const;

interface StoredAuth {
  readonly apiUrl: string | undefined;
  readonly sessionId: string | undefined;
}

const getAuth = async (): Promise<StoredAuth> =>
  (await chrome.storage.local.get([STORAGE_KEYS.apiUrl, STORAGE_KEYS.sessionId])) as StoredAuth;

const hasValidAuth = (auth: StoredAuth): auth is { apiUrl: string; sessionId: string } =>
  typeof auth.apiUrl === "string" &&
  auth.apiUrl !== "" &&
  typeof auth.sessionId === "string" &&
  auth.sessionId !== "";

const clipViaApi = async (url: string, memo: string): Promise<boolean> => {
  const auth = await getAuth();
  if (!hasValidAuth(auth)) {
    return false;
  }
  const body: Record<string, string> = { url };
  if (memo !== "") {
    body.memo = memo;
  }
  const response = await fetch(`${auth.apiUrl}/api/articles`, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${auth.sessionId}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  return response.ok;
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    contexts: ["page", "selection"],
    id: CONTEXT_MENU_ID,
    title: "Save to Web Clipper",
  });
});

chrome.contextMenus.onClicked.addListener(
  (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    if (info.menuItemId !== CONTEXT_MENU_ID) {
      return;
    }
    const url = info.pageUrl ?? tab?.url ?? "";
    const memo = info.selectionText ?? "";
    if (url === "") {
      return;
    }
    clipViaApi(url, memo).catch(() => {
      // Silently fail for context menu clips
    });
  },
);

export type { StoredAuth };
