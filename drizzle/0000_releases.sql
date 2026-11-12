CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  state TEXT NOT NULL,
  commit_hash TEXT NOT NULL,
  artifact_count INTEGER NOT NULL DEFAULT 0,
  manifest_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  rolled_back_from TEXT
);
