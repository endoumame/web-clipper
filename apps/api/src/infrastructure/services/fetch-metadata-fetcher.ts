import type { ArticleMetadata, ArticleUrl, MetadataFetcher } from "../../domain/article/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import { ResultAsync } from "neverthrow";

const FIRST_CAPTURE_GROUP = 1;

const decodeHtmlEntities = (text: string): string =>
  text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll(/&#(\d+);/g, (_match: string, code: string) => String.fromCodePoint(Number(code)));

const extractMetaContent = (html: string, property: string): string | null => {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const captured = match?.at(FIRST_CAPTURE_GROUP);
    if (typeof captured === "string" && captured !== "") {
      return decodeHtmlEntities(captured);
    }
  }
  return null;
};

const extractTitle = (html: string): string | null => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.at(FIRST_CAPTURE_GROUP)?.trim() ?? null;
};

const toFetchError = (error: unknown, url: ArticleUrl): DomainError => {
  let causeMessage = String(error);
  if (error instanceof Error) {
    causeMessage = error.message;
  }
  return {
    cause: causeMessage,
    type: "METADATA_FETCH_FAILED",
    url,
  };
};

const createFetchMetadataFetcher = (): MetadataFetcher => ({
  fetch: (url: ArticleUrl): ResultAsync<ArticleMetadata, DomainError> =>
    ResultAsync.fromPromise(
      fetch(url, {
        headers: { "User-Agent": "web-clipper-bot/1.0" },
        redirect: "follow",
      }).then(async (res: Response): Promise<string> => {
        if (!res.ok) {
          throw new Error(`HTTP ${String(res.status)}`);
        }
        const text = await res.text();
        return text;
      }),
      (error: unknown): DomainError => toFetchError(error, url),
    ).map((html: string): ArticleMetadata => {
      const rawOgImage = extractMetaContent(html, "og:image");
      let ogImageUrl: string | null = null;
      if (rawOgImage !== null && rawOgImage !== "") {
        try {
          ogImageUrl = new URL(rawOgImage, url).href;
        } catch {
          ogImageUrl = rawOgImage;
        }
      }
      return {
        description: extractMetaContent(html, "og:description"),
        ogImageUrl,
        title: extractMetaContent(html, "og:title") ?? extractTitle(html) ?? "Untitled",
      };
    }),
});

export { createFetchMetadataFetcher };
