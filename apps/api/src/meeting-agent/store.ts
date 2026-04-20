import type {
  MeetingAgentEventType,
  MeetingAgentRunStatus,
  MeetingProvider,
} from "@open-meet/feature-meeting-agent"

export interface MeetingAgentRunRecord {
  id: string
  orgSlug: string
  status: MeetingAgentRunStatus
  meetingUrl: string
  meetingProvider: MeetingProvider
  meetingTitle?: string
  botName: string
  meetingPurpose?: string
  meetingBaasBotId?: string
  sidecarSessionId?: string
  lastErrorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface MeetingAgentEventRecord {
  id: string
  runId: string
  eventType: MeetingAgentEventType
  source: "meetingbaas" | "sidecar" | "api" | "worker" | "otto"
  externalEventId?: string
  occurredAt: string
  payload: Record<string, unknown>
  createdAt: string
}

export interface CreateMeetingAgentEventRecordInput {
  runId: string
  eventType: MeetingAgentEventType
  source: MeetingAgentEventRecord["source"]
  externalEventId?: string
  occurredAt: string
  payload: Record<string, unknown>
}

export interface CreateMeetingAgentRunRecordInput {
  orgSlug: string
  status: MeetingAgentRunStatus
  meetingUrl: string
  botName: string
  meetingPurpose?: string
}

export interface MeetingAgentStore {
  createRun(
    input: CreateMeetingAgentRunRecordInput,
  ): Promise<MeetingAgentRunRecord>
  getRun(orgSlug: string, runId: string): Promise<MeetingAgentRunRecord | null>
  getRunByMeetingBaasBotId(
    meetingBaasBotId: string,
  ): Promise<MeetingAgentRunRecord | null>
  listRuns(orgSlug: string): Promise<MeetingAgentRunRecord[]>
  listEvents(runId: string): Promise<MeetingAgentEventRecord[]>
  appendEvent(
    input: CreateMeetingAgentEventRecordInput,
  ): Promise<MeetingAgentEventRecord>
  updateRun(
    runId: string,
    patch: Partial<
      Pick<
        MeetingAgentRunRecord,
        | "status"
        | "meetingBaasBotId"
        | "sidecarSessionId"
        | "lastErrorMessage"
        | "meetingTitle"
      >
    >,
  ): Promise<MeetingAgentRunRecord | null>
}

export function createInMemoryMeetingAgentStore(): MeetingAgentStore {
  const runs = new Map<string, MeetingAgentRunRecord>()
  const events = new Map<string, MeetingAgentEventRecord>()

  return {
    async createRun(input) {
      const now = new Date().toISOString()
      const run: MeetingAgentRunRecord = {
        id: crypto.randomUUID(),
        orgSlug: input.orgSlug,
        status: input.status,
        meetingUrl: input.meetingUrl,
        meetingProvider: "unknown",
        botName: input.botName,
        meetingPurpose: input.meetingPurpose,
        createdAt: now,
        updatedAt: now,
      }

      runs.set(run.id, run)

      return run
    },
    async getRun(orgSlug, runId) {
      const run = runs.get(runId)

      if (!run || run.orgSlug !== orgSlug) {
        return null
      }

      return run
    },
    async getRunByMeetingBaasBotId(meetingBaasBotId) {
      return (
        [...runs.values()].find(
          (run) => run.meetingBaasBotId === meetingBaasBotId,
        ) ?? null
      )
    },
    async listRuns(orgSlug) {
      return [...runs.values()]
        .filter((run) => run.orgSlug === orgSlug)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    },
    async listEvents(runId) {
      return [...events.values()]
        .filter((event) => event.runId === runId)
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    },
    async appendEvent(input) {
      const existingEvent =
        input.externalEventId === undefined
          ? undefined
          : [...events.values()].find(
              (event) =>
                event.runId === input.runId &&
                event.eventType === input.eventType &&
                event.externalEventId === input.externalEventId,
            )

      if (existingEvent) {
        return existingEvent
      }

      const event = {
        id: crypto.randomUUID(),
        ...input,
        createdAt: new Date().toISOString(),
      }

      events.set(event.id, event)

      return event
    },
    async updateRun(runId, patch) {
      const run = runs.get(runId)

      if (!run) {
        return null
      }

      const updatedRun = {
        ...run,
        ...patch,
        updatedAt: new Date().toISOString(),
      }

      runs.set(runId, updatedRun)

      return updatedRun
    },
  }
}
