/* oxlint-disable no-unsafe-assignment, no-unsafe-call, no-unsafe-type-assertion, no-unsafe-member-access -- Chrome extension API types not resolved by oxlint */
import type { ClipResult } from "../../types.js";

interface StoredCredentials {
  readonly apiUrl: string;
  readonly sessionId: string;
}

const STORAGE_KEYS = { apiUrl: "apiUrl", sessionId: "sessionId" } as const;

const getStoredCredentials = async (): Promise<StoredCredentials | null> => {
  const data = await chrome.storage.local.get([STORAGE_KEYS.apiUrl, STORAGE_KEYS.sessionId]);
  const apiUrl = data[STORAGE_KEYS.apiUrl] as string | undefined;
  const sessionId = data[STORAGE_KEYS.sessionId] as string | undefined;
  if (
    typeof apiUrl === "string" &&
    apiUrl !== "" &&
    typeof sessionId === "string" &&
    sessionId !== ""
  ) {
    return { apiUrl, sessionId };
  }
  return null;
};

const saveCredentials = async (apiUrl: string, sessionId: string): Promise<void> => {
  await chrome.storage.local.set({
    [STORAGE_KEYS.apiUrl]: apiUrl,
    [STORAGE_KEYS.sessionId]: sessionId,
  });
};

const clearSession = async (): Promise<void> => {
  await chrome.storage.local.remove(STORAGE_KEYS.sessionId);
};

const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const credentials = await getStoredCredentials();
  if (credentials === null) {
    throw new Error("Not authenticated");
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${credentials.sessionId}`,
    "Content-Type": "application/json",
  };
  return fetch(`${credentials.apiUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });
};

const checkSession = async (): Promise<boolean> => {
  try {
    const response = await apiFetch("/api/auth/me");
    if (!response.ok) {
      return false;
    }
    const data = (await response.json()) as { authenticated: boolean };
    return data.authenticated;
  } catch {
    return false;
  }
};

interface LoginResult {
  readonly error?: string;
  readonly success: boolean;
}

const parseLoginResponse = async (apiUrl: string, response: Response): Promise<LoginResult> => {
  if (!response.ok) {
    const data = (await response.json()) as { message?: string };
    return { error: data.message ?? "Login failed", success: false };
  }
  const data = (await response.json()) as { sessionId?: string };
  if (typeof data.sessionId !== "string" || data.sessionId === "") {
    return { error: "Server did not return session token", success: false };
  }
  await saveCredentials(apiUrl, data.sessionId);
  return { success: true };
};

const loginToApi = async (
  apiUrl: string,
  username: string,
  password: string,
): Promise<LoginResult> => {
  try {
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      body: JSON.stringify({ password, username }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    return await parseLoginResponse(apiUrl, response);
  } catch {
    return { error: "Failed to connect to API", success: false };
  }
};

const HTTP_CONFLICT = 409;

const buildClipBody = (url: string, memo?: string): string => {
  const body: Record<string, unknown> = { url };
  if (typeof memo === "string" && memo !== "") {
    body.memo = memo;
  }
  return JSON.stringify(body);
};

const parseClipResponse = async (response: Response): Promise<ClipResult> => {
  if (response.status === HTTP_CONFLICT) {
    return { error: "This article has already been saved", success: false };
  }
  if (!response.ok) {
    const data = (await response.json()) as { message?: string };
    return { error: data.message ?? "Failed to clip article", success: false };
  }
  return { success: true };
};

const clipArticle = async (url: string, memo?: string): Promise<ClipResult> => {
  try {
    const response = await apiFetch("/api/articles", {
      body: buildClipBody(url, memo),
      method: "POST",
    });
    return await parseClipResponse(response);
  } catch {
    return { error: "Failed to connect to API", success: false };
  }
};

export { checkSession, clearSession, clipArticle, getStoredCredentials, loginToApi };
