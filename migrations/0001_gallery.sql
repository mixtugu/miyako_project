CREATE TABLE comments (
  id TEXT PRIMARY KEY NOT NULL,
  photo_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX comments_photo_id ON comments(photo_id, id);

CREATE TABLE comment_positions (
  comment_id TEXT PRIMARY KEY NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  photo_id TEXT NOT NULL,
  top_pct REAL NOT NULL,
  left_pct REAL NOT NULL,
  updated_at TEXT
);
CREATE INDEX positions_photo_id ON comment_positions(photo_id);

-- Import verification metadata, never served by the public API.
CREATE TABLE import_receipts (
  sha256 TEXT PRIMARY KEY NOT NULL,
  imported_at TEXT NOT NULL,
  comment_count INTEGER NOT NULL,
  position_count INTEGER NOT NULL
);
