import { describe, expect, test } from "vitest"

import { createFakeMeetingAgentSidecarClient } from "./sidecar-client"

describe("fake meeting-agent sidecar client", () => {
  test("starts a deterministic fake session for a run", async () => {
    const client = createFakeMeetingAgentSidecarClient()

    const session = await client.startSession({
      runId: "run_123",
      orgSlug: "acme",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      botName: "Otto Meeting Agent",
    })

    expect(session).toEqual({
      provider: "fake",
      sidecarSessionId: "fake_run_123",
      status: "joining",
    })
  })
})
