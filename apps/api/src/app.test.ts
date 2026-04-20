import { describe, expect, test } from "vitest"

import { createApiApp } from "./app"
import { createInMemoryMeetingAgentStore } from "./meeting-agent/store"

describe("api app", () => {
  test("serves a no-store health response", async () => {
    const response = await createApiApp().request("/healthz")

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "api",
    })
  })

  test("creates a placeholder meeting-agent run from a workspace route", async () => {
    const app = createApiApp({
      meetingAgent: {
        store: createInMemoryMeetingAgentStore(),
      },
    })
    const response = await app.request(
      "/api/workspace/acme/meeting-agent/runs",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingUrl: "https://meet.google.com/abc-defg-hij",
        }),
      },
    )

    expect(response.status).toBe(202)
    const body = await response.json()
    expect(body.run.status).toBe("joining")
    expect(body.run.botName).toBe("Otto Meeting Agent")
    expect(body.run.sidecarSessionId).toMatch(/^fake_/)
    expect(body.nextStep).toBe("sidecar_session_started")

    const detailResponse = await app.request(
      `/api/workspace/acme/meeting-agent/runs/${body.run.id}`,
    )

    expect(detailResponse.status).toBe(200)
    await expect(detailResponse.json()).resolves.toMatchObject({
      run: {
        id: body.run.id,
        status: "joining",
      },
      latestState: null,
      recentEvents: [],
      transcriptSegments: [],
    })
  })
})
