interface Article {
  aiSummary: string | null;
  content: string | null;
  createdAt: string;
  description: string | null;
  id: string;
  isRead: boolean;
  memo: string | null;
  ogImageUrl: string | null;
  source:
    | "classmethod"
    | "devto"
    | "github"
    | "hatena"
    | "medium"
    | "note"
    | "other"
    | "qiita"
    | "stackoverflow"
    | "twitter"
    | "zenn";
  tags: string[];
  title: string;
  updatedAt: string;
  url: string;
}

interface Highlight {
  id: string;
  articleId: string;
  highlightedText: string;
  note: string | null;
  startOffset: number;
  endOffset: number;
  prefixContext: string;
  suffixContext: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  articleCount: number;
  createdAt: string;
  id: string;
  name: string;
}

export type { Article, Highlight, Tag };
