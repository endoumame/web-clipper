import type { ArticleId } from "../article/article-id.js";
import type { HighlightId } from "./highlight-id.js";

const DEFAULT_COLOR = "yellow";

interface Highlight {
  readonly id: HighlightId;
  readonly articleId: ArticleId;
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

interface CreateParams {
  readonly id: HighlightId;
  readonly articleId: ArticleId;
  readonly highlightedText: string;
  readonly note: string | null;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly prefixContext: string;
  readonly suffixContext: string;
  readonly color?: string;
}

const create = (params: CreateParams): Highlight => {
  const now = new Date();
  return {
    ...params,
    color: params.color ?? DEFAULT_COLOR,
    createdAt: now,
    updatedAt: now,
  };
};

const reconstruct = (params: Highlight): Highlight => ({ ...params });

const updateNote = (highlight: Highlight, note: string | null): Highlight => ({
  ...highlight,
  note,
  updatedAt: new Date(),
});

const updateColor = (highlight: Highlight, color: string): Highlight => ({
  ...highlight,
  color,
  updatedAt: new Date(),
});

const HighlightEntity = {
  create,
  reconstruct,
  updateColor,
  updateNote,
} as const;

export { HighlightEntity };
export type { Highlight };
