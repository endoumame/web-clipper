import { z } from "zod";

const SOURCES = [
  "twitter",
  "qiita",
  "zenn",
  "hatena",
  "github",
  "classmethod",
  "medium",
  "note",
  "devto",
  "stackoverflow",
  "other",
] as const;

type Source = (typeof SOURCES)[number];

const EXACT_HOSTNAME_MAP: Readonly<Record<string, Source>> = {
  "dev.classmethod.jp": "classmethod",
  "dev.to": "devto",
  "github.com": "github",
  "hatenablog.com": "hatena",
  "hatenablog.jp": "hatena",
  "medium.com": "medium",
  "note.com": "note",
  "qiita.com": "qiita",
  "stackoverflow.com": "stackoverflow",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "zenn.dev": "zenn",
};

const matchHatenaSuffix = (hostname: string): boolean =>
  hostname.endsWith(".hateblo.jp") ||
  hostname.endsWith(".hatenablog.com") ||
  hostname.endsWith(".hatenablog.jp");

const matchHostname = (hostname: string): Source | null => {
  const exact = EXACT_HOSTNAME_MAP[hostname];
  if (exact) {
    return exact;
  }
  if (matchHatenaSuffix(hostname)) {
    return "hatena";
  }
  return null;
};

const fromUrl = (url: string): Source => {
  let hostname = "";
  try {
    ({ hostname } = new URL(url));
  } catch {
    return "other";
  }

  return matchHostname(hostname) ?? "other";
};

const SourceSchema = z.enum(SOURCES);

const SourceVO = { fromUrl, schema: SourceSchema, values: SOURCES } as const;

export { SourceVO };
export type { Source };
