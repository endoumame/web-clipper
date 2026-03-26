import type { ArticleSummarizer } from "../../domain/article/index.js";
import type { DomainError } from "../../domain/shared/index.js";
import { ResultAsync } from "neverthrow";

const TRUNCATE_START = 0;
const MAX_TEXT_LENGTH = 6000;

const createWorkersAiSummarizer = (ai: Ai): ArticleSummarizer => ({
  summarize: (text: string): ResultAsync<string, DomainError> =>
    ResultAsync.fromPromise(
      (async (): Promise<string> => {
        const truncated = text.slice(TRUNCATE_START, MAX_TEXT_LENGTH);
        const response = await ai.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
          messages: [
            {
              content:
                "You are a helpful assistant that summarizes web articles. Provide a concise summary in Japanese (3-5 sentences). Focus on the key points and main takeaways.",
              role: "system",
            },
            {
              content: `以下の記事内容を日本語で簡潔に要約してください:\n\n${truncated}`,
              role: "user",
            },
          ],
        });
        if (typeof response === "object" && response !== null && "response" in response) {
          const typed = response as Record<string, unknown>;
          return String(typed.response);
        }
        throw new Error("Unexpected AI response format");
      })(),
      (error: unknown): DomainError => {
        let causeMessage = String(error);
        if (error instanceof Error) {
          causeMessage = error.message;
        }
        return {
          cause: causeMessage,
          type: "SUMMARY_GENERATION_FAILED",
        };
      },
    ),
});

export { createWorkersAiSummarizer };
