import { zValidator } from "@hono/zod-validator"
import {
  DEFAULT_MEETING_AGENT_BOT_NAME,
  meetingAgentEventSchema,
  meetingAgentRunCreateSchema,
} from "@open-meet/feature-meeting-agent"
import { Hono } from "hono"

export function createMeetingAgentRouter() {
  const router = new Hono()

  router.post(
    "/api/workspace/:orgSlug/meeting-agent/runs",
    zValidator("json", meetingAgentRunCreateSchema),
    (context) => {
      const orgSlug = context.req.param("orgSlug")
      const request = context.req.valid("json")
      const now = new Date().toISOString()

      return context.json(
        {
          run: {
            id: crypto.randomUUID(),
            orgSlug,
            status: "queued",
            meetingUrl: request.meetingUrl,
            meetingProvider: "unknown",
            botName: request.botName ?? DEFAULT_MEETING_AGENT_BOT_NAME,
            createdAt: now,
            updatedAt: now,
          },
          nextStep: "meetingbaas_start",
        },
        202,
      )
    },
  )

  router.get("/api/workspace/:orgSlug/meeting-agent/runs", (context) => {
    return context.json({ runs: [] }, 200)
  })

  router.post("/api/webhooks/meetingbaas", async (context) => {
    const payload = await context.req.json().catch(() => ({}))

    return context.json(
      {
        accepted: true,
        verification: "svix_not_configured",
        eventType:
          typeof payload === "object" && payload !== null && "type" in payload
            ? payload.type
            : "unknown",
      },
      202,
    )
  })

  router.post(
    "/api/internal/meeting-agent/runs/:runId/events",
    zValidator("json", meetingAgentEventSchema.omit({ runId: true })),
    (context) => {
      return context.json(
        {
          accepted: true,
          runId: context.req.param("runId"),
          eventType: context.req.valid("json").eventType,
        },
        202,
      )
    },
  )

  return router
}
