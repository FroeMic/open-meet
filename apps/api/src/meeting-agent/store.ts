import type {
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
  listRuns(orgSlug: string): Promise<MeetingAgentRunRecord[]>
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
    async listRuns(orgSlug) {
      return [...runs.values()]
        .filter((run) => run.orgSlug === orgSlug)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
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
