-- Backfill: source='other' の記事を URL から正しいソースに再分類する
-- 新規追加ソース + はてなブログのサブドメイン修正分

UPDATE articles SET source = 'github'
WHERE source = 'other' AND url LIKE '%://github.com/%';
--> statement-breakpoint
UPDATE articles SET source = 'classmethod'
WHERE source = 'other' AND url LIKE '%://dev.classmethod.jp/%';
--> statement-breakpoint
UPDATE articles SET source = 'medium'
WHERE source = 'other' AND url LIKE '%://medium.com/%';
--> statement-breakpoint
UPDATE articles SET source = 'note'
WHERE source = 'other' AND url LIKE '%://note.com/%';
--> statement-breakpoint
UPDATE articles SET source = 'devto'
WHERE source = 'other' AND url LIKE '%://dev.to/%';
--> statement-breakpoint
UPDATE articles SET source = 'stackoverflow'
WHERE source = 'other' AND url LIKE '%://stackoverflow.com/%';
--> statement-breakpoint
-- はてなブログ: サブドメイン形式 (例: foo.hatenablog.com) が other に分類されていたバグの修正
UPDATE articles SET source = 'hatena'
WHERE source = 'other' AND (
  url LIKE '%://%.hatenablog.com/%' OR url LIKE '%://%.hatenablog.com'
  OR url LIKE '%://%.hatenablog.jp/%' OR url LIKE '%://%.hatenablog.jp'
);
