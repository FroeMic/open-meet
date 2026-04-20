import { sqliteTable, text } from "drizzle-orm/sqlite-core"

export const meetingAgentRuns = sqliteTable("meeting_agent_runs", {
  id: text("id").primaryKey(),
  orgSlug: text("org_slug").notNull(),
  status: text("status").notNull(),
  meetingUrl: text("meeting_url").notNull(),
  meetingProvider: text("meeting_provider").notNull().default("unknown"),
  meetingTitle: text("meeting_title"),
  botName: text("bot_name").notNull(),
  meetingPurpose: text("meeting_purpose"),
  meetingBaasBotId: text("meeting_baas_bot_id"),
  sidecarSessionId: text("sidecar_session_id"),
  lastErrorMessage: text("last_error_message"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

export const meetingAgentEvents = sqliteTable("meeting_agent_events", {
  id: text("id").primaryKey(),
  runId: text("meeting_agent_run_id").notNull(),
  eventType: text("event_type").notNull(),
  source: text("source").notNull(),
  externalEventId: text("external_event_id"),
  occurredAt: text("occurred_at").notNull(),
  payloadJson: text("payload_json").notNull(),
  createdAt: text("created_at").notNull(),
})

export type MeetingAgentRunRow = typeof meetingAgentRuns.$inferSelect
