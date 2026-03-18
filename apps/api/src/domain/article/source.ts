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
export type Source = (typeof SOURCES)[number];

const fromUrl = (url: string): Source => {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return "other";
  }

  if (hostname === "twitter.com" || hostname === "x.com") {
    return "twitter";
  }
  if (hostname === "qiita.com") {
    return "qiita";
  }
  if (hostname === "zenn.dev") {
    return "zenn";
  }
  if (
    hostname.endsWith(".hateblo.jp") ||
    hostname === "hatenablog.com" ||
    hostname.endsWith(".hatenablog.com") ||
    hostname === "hatenablog.jp" ||
    hostname.endsWith(".hatenablog.jp")
  ) {
    return "hatena";
  }
  if (hostname === "github.com") {
    return "github";
  }
  if (hostname === "dev.classmethod.jp") {
    return "classmethod";
  }
  if (hostname === "medium.com") {
    return "medium";
  }
  if (hostname === "note.com") {
    return "note";
  }
  if (hostname === "dev.to") {
    return "devto";
  }
  if (hostname === "stackoverflow.com") {
    return "stackoverflow";
  }

  return "other";
};

const SourceSchema = z.enum(SOURCES);

export const SourceVO = { values: SOURCES, fromUrl, schema: SourceSchema } as const;
