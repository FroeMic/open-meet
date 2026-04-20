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
    expect(body.run.meetingBaasBotId).toMatch(/^fake_bot_/)
    expect(body.nextStep).toBe("meeting_transport_started")

    const detailResponse = await app.request(
      `/api/workspace/acme/meeting-agent/runs/${body.run.id}`,
    )

    expect(detailResponse.status).toBe(200)
    await expect(detailResponse.json()).resolves.toMatchObject({
      run: {
        id: body.run.id,
        status: "joining",
        meetingBaasBotId: body.run.meetingBaasBotId,
      },
      latestState: null,
      recentEvents: [],
      transcriptSegments: [],
    })
  })

  test("updates a run from a MeetingBaas lifecycle webhook", async () => {
    const app = createApiApp({
      meetingAgent: {
        store: createInMemoryMeetingAgentStore(),
      },
    })
    const createResponse = await app.request(
      "/api/workspace/acme/meeting-agent/runs",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingUrl: "https://meet.google.com/abc-defg-hij",
        }),
      },
    )
    const createdBody = await createResponse.json()

    const webhookResponse = await app.request("/api/webhooks/meetingbaas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "evt_123",
        type: "bot.status_change",
        bot: { id: createdBody.run.meetingBaasBotId },
        status: "in_call",
      }),
    })

    expect(webhookResponse.status).toBe(202)
    const detailResponse = await app.request(
      `/api/workspace/acme/meeting-agent/runs/${createdBody.run.id}`,
    )

    await expect(detailResponse.json()).resolves.toMatchObject({
      run: { status: "joined" },
      recentEvents: [{ externalEventId: "evt_123" }],
    })
  })

  test("ingests sidecar transcript and state events into run detail", async () => {
    const app = createApiApp({
      meetingAgent: {
        store: createInMemoryMeetingAgentStore(),
      },
    })
    const createResponse = await app.request(
      "/api/workspace/acme/meeting-agent/runs",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingUrl: "https://meet.google.com/abc-defg-hij",
        }),
      },
    )
    const createdBody = await createResponse.json()

    await app.request(
      `/api/internal/meeting-agent/runs/${createdBody.run.id}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "transcript_delta",
          source: "sidecar",
          occurredAt: "2026-04-20T10:00:00.000Z",
          payload: {
            text: "Can Otto check the launch note?",
            speaker_name: "Mia",
            segment_id: "seg_1",
            is_final: true,
          },
        }),
      },
    )
    await app.request(
      `/api/internal/meeting-agent/runs/${createdBody.run.id}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "state_snapshot",
          source: "sidecar",
          occurredAt: "2026-04-20T10:00:01.000Z",
          payload: {
            summary: "Discussing launch notes.",
            current_topic: "Launch readiness",
            open_questions: ["Who follows up?"],
          },
        }),
      },
    )

    const detailResponse = await app.request(
      `/api/workspace/acme/meeting-agent/runs/${createdBody.run.id}`,
    )

    await expect(detailResponse.json()).resolves.toMatchObject({
      latestState: {
        summary: "Discussing launch notes.",
        currentTopic: "Launch readiness",
      },
      transcriptSegments: [
        {
          text: "Can Otto check the launch note?",
          speakerName: "Mia",
        },
      ],
    })
  })
})
