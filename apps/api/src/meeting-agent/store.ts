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

export interface MeetingAgentTranscriptSegmentRecord {
  id: string
  runId: string
  source: "meetingbaas" | "sidecar"
  speakerName?: string
  text: string
  startSeconds?: number
  endSeconds?: number
  confidence?: number
  isFinal: boolean
  externalSegmentId?: string
  payload: Record<string, unknown>
  createdAt: string
}

export interface MeetingAgentStateSnapshotRecord {
  id: string
  runId: string
  sequence: number
  summary: string
  currentTopic?: string
  openQuestions: string[]
  decisions: string[]
  actionItems: string[]
  recentContext: string[]
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

export interface CreateTranscriptSegmentInput {
  runId: string
  source: MeetingAgentTranscriptSegmentRecord["source"]
  speakerName?: string
  text: string
  startSeconds?: number
  endSeconds?: number
  confidence?: number
  isFinal: boolean
  externalSegmentId?: string
  payload: Record<string, unknown>
}

export interface CreateStateSnapshotInput {
  runId: string
  summary: string
  currentTopic?: string
  openQuestions?: string[]
  decisions?: string[]
  actionItems?: string[]
  recentContext?: string[]
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
  listTranscriptSegments(
    runId: string,
  ): Promise<MeetingAgentTranscriptSegmentRecord[]>
  getLatestStateSnapshot(
    runId: string,
  ): Promise<MeetingAgentStateSnapshotRecord | null>
  appendEvent(
    input: CreateMeetingAgentEventRecordInput,
  ): Promise<MeetingAgentEventRecord>
  appendTranscriptSegment(
    input: CreateTranscriptSegmentInput,
  ): Promise<MeetingAgentTranscriptSegmentRecord>
  appendStateSnapshot(
    input: CreateStateSnapshotInput,
  ): Promise<MeetingAgentStateSnapshotRecord>
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
  const transcriptSegments = new Map<
    string,
    MeetingAgentTranscriptSegmentRecord
  >()
  const stateSnapshots = new Map<string, MeetingAgentStateSnapshotRecord>()

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
    async listTranscriptSegments(runId) {
      return [...transcriptSegments.values()]
        .filter((segment) => segment.runId === runId)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    },
    async getLatestStateSnapshot(runId) {
      return (
        [...stateSnapshots.values()]
          .filter((snapshot) => snapshot.runId === runId)
          .sort((left, right) => right.sequence - left.sequence)[0] ?? null
      )
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
    async appendTranscriptSegment(input) {
      const existingSegment =
        input.externalSegmentId === undefined
          ? undefined
          : [...transcriptSegments.values()].find(
              (segment) =>
                segment.runId === input.runId &&
                segment.externalSegmentId === input.externalSegmentId,
            )

      if (existingSegment) {
        return existingSegment
      }

      const segment = {
        id: crypto.randomUUID(),
        ...input,
        createdAt: new Date().toISOString(),
      }

      transcriptSegments.set(segment.id, segment)

      return segment
    },
    async appendStateSnapshot(input) {
      const nextSequence =
        Math.max(
          0,
          ...[...stateSnapshots.values()]
            .filter((snapshot) => snapshot.runId === input.runId)
            .map((snapshot) => snapshot.sequence),
        ) + 1
      const snapshot = {
        id: crypto.randomUUID(),
        runId: input.runId,
        sequence: nextSequence,
        summary: input.summary,
        currentTopic: input.currentTopic,
        openQuestions: input.openQuestions ?? [],
        decisions: input.decisions ?? [],
        actionItems: input.actionItems ?? [],
        recentContext: input.recentContext ?? [],
        createdAt: new Date().toISOString(),
      }

      stateSnapshots.set(snapshot.id, snapshot)

      return snapshot
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
