import type { ArticleUrl } from "../../domain/article/article-url.js";
import type { ContentExtractor } from "../../domain/article/content-extractor.js";
import type { DomainError } from "../../domain/shared/index.js";
import { Readability } from "@mozilla/readability";
import { ResultAsync } from "neverthrow";
import TurndownService from "turndown";
import { parseHTML } from "linkedom";

const fetchAndParseHtml = async (url: ArticleUrl): Promise<{ document: Document }> => {
  const res = await fetch(url, {
    headers: { "User-Agent": "web-clipper-bot/1.0" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${String(res.status)}`);
  }
  const html = await res.text();
  return parseHTML(html);
};

const extractArticleContent = (document: Document): string => {
  const reader = new Readability(document);
  const article = reader.parse();

  if (
    article === null ||
    article.content === null ||
    typeof article.content !== "string" ||
    article.content === ""
  ) {
    throw new Error("Failed to extract article content");
  }

  return article.content;
};

const convertToMarkdown = (content: string): string => {
  const { document: contentDoc } = parseHTML(content);
  const turndown = new TurndownService({ headingStyle: "atx" });
  return turndown.turndown(contentDoc.documentElement);
};

const createReadabilityContentExtractor = (): ContentExtractor => ({
  extract: (url: ArticleUrl): ResultAsync<string, DomainError> =>
    ResultAsync.fromPromise(
      (async (): Promise<string> => {
        const { document } = await fetchAndParseHtml(url);
        const content = extractArticleContent(document);
        return convertToMarkdown(content);
      })(),
      (error: unknown): DomainError => {
        let causeMessage = String(error);
        if (error instanceof Error) {
          causeMessage = error.message;
        }
        return {
          cause: causeMessage,
          type: "METADATA_FETCH_FAILED",
          url,
        };
      },
    ),
});

export { createReadabilityContentExtractor };
