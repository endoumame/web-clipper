import { ResultAsync } from "neverthrow";
import type { ArticleSummarizer } from "../../domain/article/index.js";
import type { DomainError } from "../../domain/shared/index.js";

export const createWorkersAiSummarizer = (ai: Ai): ArticleSummarizer => ({
  summarize: (text: string): ResultAsync<string, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const truncated = text.slice(0, 6000);
        const response = await ai.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that summarizes web articles. Provide a concise summary in Japanese (3-5 sentences). Focus on the key points and main takeaways.",
            },
            {
              role: "user",
              content: `以下の記事内容を日本語で簡潔に要約してください:\n\n${truncated}`,
            },
          ],
        });
        if (typeof response === "object" && response !== null && "response" in response) {
          return (response as { response: string }).response;
        }
        throw new Error("Unexpected AI response format");
      })(),
      (error): DomainError => ({
        type: "SUMMARY_GENERATION_FAILED",
        cause: error instanceof Error ? error.message : String(error),
      }),
    ),
});
