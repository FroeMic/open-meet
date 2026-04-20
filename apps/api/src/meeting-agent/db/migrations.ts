export const MEETING_AGENT_RUNS_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS meeting_agent_runs (
  id TEXT PRIMARY KEY NOT NULL,
  org_slug TEXT NOT NULL,
  status TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  meeting_provider TEXT NOT NULL DEFAULT 'unknown',
  meeting_title TEXT,
  bot_name TEXT NOT NULL,
  meeting_purpose TEXT,
  meeting_baas_bot_id TEXT,
  sidecar_session_id TEXT,
  last_error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS meeting_agent_runs_org_slug_created_at_idx
  ON meeting_agent_runs (org_slug, created_at);
`
