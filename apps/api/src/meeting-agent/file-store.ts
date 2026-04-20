import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

import type { MeetingAgentRunRecord, MeetingAgentStore } from "./store"

interface PersistedMeetingAgentRuns {
  runs: MeetingAgentRunRecord[]
  events: Awaited<ReturnType<MeetingAgentStore["appendEvent"]>>[]
}

export function createFileMeetingAgentStore(
  filePath: string,
): MeetingAgentStore {
  return {
    async createRun(input) {
      const state = readState(filePath)
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

      writeState(filePath, {
        ...state,
        runs: [...state.runs, run],
      })

      return run
    },
    async getRun(orgSlug, runId) {
      return (
        readState(filePath).runs.find(
          (run) => run.orgSlug === orgSlug && run.id === runId,
        ) ?? null
      )
    },
    async getRunByMeetingBaasBotId(meetingBaasBotId) {
      return (
        readState(filePath).runs.find(
          (run) => run.meetingBaasBotId === meetingBaasBotId,
        ) ?? null
      )
    },
    async listRuns(orgSlug) {
      return readState(filePath)
        .runs.filter((run) => run.orgSlug === orgSlug)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    },
    async listEvents(runId) {
      return readState(filePath)
        .events.filter((event) => event.runId === runId)
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    },
    async appendEvent(input) {
      const state = readState(filePath)
      const existingEvent =
        input.externalEventId === undefined
          ? undefined
          : state.events.find(
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

      writeState(filePath, {
        ...state,
        events: [...state.events, event],
      })

      return event
    },
    async updateRun(runId, patch) {
      const state = readState(filePath)
      const existingRun = state.runs.find((run) => run.id === runId)

      if (!existingRun) {
        return null
      }

      const updatedRun = {
        ...existingRun,
        ...patch,
        updatedAt: new Date().toISOString(),
      }

      writeState(filePath, {
        ...state,
        runs: state.runs.map((run) => (run.id === runId ? updatedRun : run)),
      })

      return updatedRun
    },
  }
}

export function getDefaultMeetingAgentStorePath() {
  return process.env.MEETING_AGENT_STORE_PATH ?? ".data/meeting-agent-runs.json"
}

export function createDefaultMeetingAgentStore() {
  return createFileMeetingAgentStore(getDefaultMeetingAgentStorePath())
}

function readState(filePath: string): PersistedMeetingAgentRuns {
  if (!existsSync(filePath)) {
    return { runs: [], events: [] }
  }

  const state = JSON.parse(
    readFileSync(filePath, "utf8"),
  ) as Partial<PersistedMeetingAgentRuns>

  return {
    runs: state.runs ?? [],
    events: state.events ?? [],
  }
}

function writeState(filePath: string, state: PersistedMeetingAgentRuns) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`)
}
