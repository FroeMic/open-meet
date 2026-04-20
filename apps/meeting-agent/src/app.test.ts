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

  test("starts a fake sidecar session", async () => {
    const response = await createMeetingAgentSidecarApp().request("/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: "run_123",
        meetingUrl: "https://meet.google.com/abc-defg-hij",
      }),
    })

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toMatchObject({
      accepted: true,
      provider: "meetingbaas_hosted",
      sidecarSessionId: "sidecar_run_123",
    })
  })
})
