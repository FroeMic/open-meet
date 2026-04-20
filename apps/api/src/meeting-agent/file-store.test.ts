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

      const secondStore = createFileMeetingAgentStore(filePath)

      await expect(secondStore.getRun("acme", run.id)).resolves.toMatchObject({
        id: run.id,
        status: "joining",
        sidecarSessionId: "fake_run",
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
