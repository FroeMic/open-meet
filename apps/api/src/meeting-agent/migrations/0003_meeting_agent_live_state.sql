CREATE TABLE IF NOT EXISTS meeting_agent_transcript_segments (
  id TEXT PRIMARY KEY NOT NULL,
  meeting_agent_run_id TEXT NOT NULL,
  source TEXT NOT NULL,
  speaker_name TEXT,
  text TEXT NOT NULL,
  start_seconds TEXT,
  end_seconds TEXT,
  confidence TEXT,
  is_final TEXT NOT NULL,
  external_segment_id TEXT,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS meeting_agent_transcript_segments_run_created_at_idx
  ON meeting_agent_transcript_segments (meeting_agent_run_id, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS meeting_agent_transcript_segments_external_unique_idx
  ON meeting_agent_transcript_segments (meeting_agent_run_id, external_segment_id)
  WHERE external_segment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS meeting_agent_state_snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  meeting_agent_run_id TEXT NOT NULL,
  sequence TEXT NOT NULL,
  summary TEXT NOT NULL,
  current_topic TEXT,
  open_questions_json TEXT NOT NULL,
  decisions_json TEXT NOT NULL,
  action_items_json TEXT NOT NULL,
  recent_context_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS meeting_agent_state_snapshots_run_sequence_idx
  ON meeting_agent_state_snapshots (meeting_agent_run_id, sequence);
