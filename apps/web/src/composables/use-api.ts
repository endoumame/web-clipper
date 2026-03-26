import type { AppType } from "@web-clipper/api";
import { hc } from "hono/client";

type HonoClient = ReturnType<typeof hc<AppType>>;

const baseUrl: string = import.meta.env.VITE_API_URL ?? "/";

const client: HonoClient = hc<AppType>(baseUrl, {
  fetch: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await fetch(input, {
      ...init,
      credentials: "include",
    });
    return response;
  },
});

const useApi = (): HonoClient => client;

export { useApi };
