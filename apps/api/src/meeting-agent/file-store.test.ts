import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, test } from "vitest"

import { createFileMeetingAgentStore } from "./file-store"

describe("file meeting-agent store", () => {
  test("persists runs across store instances", async () => {
    const directory = mkdtempSync(join(tmpdir(), "open-meet-"))
    const filePath = join(directory, "meeting-agent-runs.json")

    try {
      const firstStore = createFileMeetingAgentStore(filePath)
      const run = await firstStore.createRun({
        orgSlug: "acme",
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        botName: "Otto Meeting Agent",
        status: "queued",
      })

      await firstStore.updateRun(run.id, {
        status: "joining",
        sidecarSessionId: "fake_run",
      })
      await firstStore.appendEvent({
        runId: run.id,
        eventType: "bot_status_changed",
        source: "meetingbaas",
        externalEventId: "evt_123",
        occurredAt: "2026-04-20T10:00:00.000Z",
        payload: { status: "joined" },
      })
      await firstStore.appendEvent({
        runId: run.id,
        eventType: "bot_status_changed",
        source: "meetingbaas",
        externalEventId: "evt_123",
        occurredAt: "2026-04-20T10:00:00.000Z",
        payload: { status: "joined" },
      })

      const secondStore = createFileMeetingAgentStore(filePath)

      await expect(secondStore.getRun("acme", run.id)).resolves.toMatchObject({
        id: run.id,
        status: "joining",
        sidecarSessionId: "fake_run",
      })
      await expect(secondStore.listEvents(run.id)).resolves.toHaveLength(1)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
