interface HighlightDetail {
  readonly id: string;
  readonly articleId: string;
  readonly highlightedText: string;
  readonly note: string | null;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly prefixContext: string;
  readonly suffixContext: string;
  readonly color: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface HighlightQueryService {
  readonly listByArticleId: (articleId: string) => Promise<readonly HighlightDetail[]>;
}

export type { HighlightDetail, HighlightQueryService };
