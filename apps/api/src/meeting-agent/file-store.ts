import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

import type { MeetingAgentRunRecord, MeetingAgentStore } from "./store"

interface PersistedMeetingAgentRuns {
  runs: MeetingAgentRunRecord[]
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
    async listRuns(orgSlug) {
      return readState(filePath)
        .runs.filter((run) => run.orgSlug === orgSlug)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
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
    return { runs: [] }
  }

  return JSON.parse(readFileSync(filePath, "utf8")) as PersistedMeetingAgentRuns
}

function writeState(filePath: string, state: PersistedMeetingAgentRuns) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`)
}
