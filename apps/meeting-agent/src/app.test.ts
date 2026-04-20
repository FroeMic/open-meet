import { describe, expect, test } from "vitest"

import { createMeetingAgentSidecarApp } from "./app"

describe("meeting-agent sidecar app", () => {
  test("serves a sidecar health response", async () => {
    const response = await createMeetingAgentSidecarApp().request("/healthz")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "meeting-agent",
    })
  })
})
