import { z } from "zod"

export const MEETING_AGENT_JOB_TYPES = [
  "meeting_agent_start",
  "meeting_agent_poll_status",
  "meeting_agent_ingest_artifacts",
  "meeting_agent_stop",
  "meeting_agent_timeout",
] as const

export const meetingAgentJobSchema = z.object({
  type: z.enum(MEETING_AGENT_JOB_TYPES),
  runId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
})

export type MeetingAgentJob = z.infer<typeof meetingAgentJobSchema>

export function parseMeetingAgentJob(input: unknown): MeetingAgentJob {
  return meetingAgentJobSchema.parse(input)
}
