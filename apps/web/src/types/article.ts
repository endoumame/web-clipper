export interface Article {
  id: string;
  url: string;
  title: string;
  description: string | null;
  source:
    | "twitter"
    | "qiita"
    | "zenn"
    | "hatena"
    | "github"
    | "classmethod"
    | "medium"
    | "note"
    | "devto"
    | "stackoverflow"
    | "other";
  ogImageUrl: string | null;
  memo: string | null;
  isRead: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  articleCount: number;
  createdAt: string;
}
