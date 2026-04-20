import { describe, expect, test } from "vitest"

import { MEETING_AGENT_JOB_TYPES, parseMeetingAgentJob } from "./jobs"

describe("meeting-agent worker jobs", () => {
  test("tracks the first PoC job types from the spec", () => {
    expect(MEETING_AGENT_JOB_TYPES).toEqual([
      "meeting_agent_start",
      "meeting_agent_poll_status",
      "meeting_agent_ingest_artifacts",
      "meeting_agent_stop",
      "meeting_agent_timeout",
    ])
  })

  test("parses a start job payload", () => {
    const job = parseMeetingAgentJob({
      type: "meeting_agent_start",
      runId: "run_123",
    })

    expect(job.type).toBe("meeting_agent_start")
    expect(job.runId).toBe("run_123")
  })
})
