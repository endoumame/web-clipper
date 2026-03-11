import { ResultAsync } from "neverthrow";
import type { MetadataFetcher, ArticleMetadata } from "../../domain/ports/mod.js";
import type { ArticleUrl } from "../../domain/values/mod.js";
import type { DomainError } from "../../domain/errors.js";

const decodeHtmlEntities = (text: string): string =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

const extractMetaContent = (html: string, property: string): string | null => {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return null;
};

const extractTitle = (html: string): string | null => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || null;
};

export const createFetchMetadataFetcher = (): MetadataFetcher => ({
  fetch: (url: ArticleUrl): ResultAsync<ArticleMetadata, DomainError> =>
    ResultAsync.fromPromise(
      fetch(url, {
        headers: { "User-Agent": "web-clipper-bot/1.0" },
        redirect: "follow",
      }).then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      }),
      (error): DomainError => ({
        type: "METADATA_FETCH_FAILED",
        url,
        cause: error instanceof Error ? error.message : String(error),
      }),
    ).map((html): ArticleMetadata => {
      const rawOgImage = extractMetaContent(html, "og:image");
      let ogImageUrl: string | null = null;
      if (rawOgImage) {
        try {
          ogImageUrl = new URL(rawOgImage, url).href;
        } catch {
          ogImageUrl = rawOgImage;
        }
      }
      return {
        title: extractMetaContent(html, "og:title") ?? extractTitle(html) ?? "Untitled",
        description: extractMetaContent(html, "og:description"),
        ogImageUrl,
      };
    }),
});
