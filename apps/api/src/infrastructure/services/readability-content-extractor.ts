import { ResultAsync } from "neverthrow";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import type { ContentExtractor } from "../../domain/article/content-extractor.js";
import type { ArticleUrl } from "../../domain/article/article-url.js";
import type { DomainError } from "../../domain/shared/index.js";

export const createReadabilityContentExtractor = (): ContentExtractor => ({
  extract: (url: ArticleUrl): ResultAsync<string, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const res = await fetch(url, {
          headers: { "User-Agent": "web-clipper-bot/1.0" },
          redirect: "follow",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();

        const { document } = parseHTML(html);
        const reader = new Readability(document);
        const article = reader.parse();

        if (!article?.content) {
          throw new Error("Failed to extract article content");
        }

        // Parse article HTML via linkedom so turndown receives a DOM node
        // instead of a string — avoids turndown's internal DOMParser which
        // relies on the global `document` (unavailable in Workers).
        const { document: contentDoc } = parseHTML(article.content);
        const turndown = new TurndownService({ headingStyle: "atx" });
        const markdown = turndown.turndown(contentDoc.documentElement);

        return markdown;
      })(),
      (error): DomainError => ({
        type: "METADATA_FETCH_FAILED",
        url,
        cause: error instanceof Error ? error.message : String(error),
      }),
    ),
});
