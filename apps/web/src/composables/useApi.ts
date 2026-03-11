import { hc } from "hono/client";
import type { AppType } from "@web-clipper/api";

const baseUrl = import.meta.env.VITE_API_URL || "/";

const client = hc<AppType>(baseUrl, {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
});

export function useApi() {
  return client;
}
