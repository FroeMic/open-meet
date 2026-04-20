import { describe, expect, test } from "vitest"

import { createInMemoryMeetingAgentStore } from "./store"

describe("in-memory meeting-agent store", () => {
  test("creates, lists, fetches, and updates runs", async () => {
    const store = createInMemoryMeetingAgentStore()
    const run = await store.createRun({
      orgSlug: "acme",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      botName: "Otto Meeting Agent",
      status: "queued",
    })

    await store.updateRun(run.id, {
      status: "joining",
      sidecarSessionId: "fake_run",
    })

    await expect(store.listRuns("acme")).resolves.toHaveLength(1)
    await expect(store.getRun("acme", run.id)).resolves.toMatchObject({
      id: run.id,
      status: "joining",
      sidecarSessionId: "fake_run",
    })
  })
})
