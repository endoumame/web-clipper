ALTER TABLE articles ADD COLUMN content TEXT;

CREATE TABLE highlights (
  id TEXT PRIMARY KEY NOT NULL,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  highlighted_text TEXT NOT NULL,
  note TEXT,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  prefix_context TEXT NOT NULL DEFAULT '',
  suffix_context TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'yellow',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
