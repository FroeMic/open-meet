CREATE TABLE IF NOT EXISTS meeting_agent_events (
  id TEXT PRIMARY KEY NOT NULL,
  meeting_agent_run_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  external_event_id TEXT,
  occurred_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS meeting_agent_events_run_occurred_at_idx
  ON meeting_agent_events (meeting_agent_run_id, occurred_at);

CREATE UNIQUE INDEX IF NOT EXISTS meeting_agent_events_external_event_unique_idx
  ON meeting_agent_events (meeting_agent_run_id, event_type, external_event_id)
  WHERE external_event_id IS NOT NULL;
