import { zValidator } from "@hono/zod-validator"
import {
  DEFAULT_MEETING_AGENT_BOT_NAME,
  meetingAgentEventSchema,
  meetingAgentRunCreateSchema,
} from "@open-meet/feature-meeting-agent"
import { Hono } from "hono"

import { createDefaultMeetingAgentStore } from "./file-store"
import {
  createMeetingTransportFromEnv,
  type MeetingTransport,
} from "./meeting-transport"
import {
  createInMemoryMeetingAgentStore,
  type MeetingAgentStore,
} from "./store"

export interface MeetingAgentRouterDependencies {
  meetingTransport: MeetingTransport
  store: MeetingAgentStore
}

export function createMeetingAgentRouter(
  dependencies: Partial<MeetingAgentRouterDependencies> = {},
) {
  const store =
    dependencies.store ??
    (process.env.MEETING_AGENT_STORE === "memory"
      ? createInMemoryMeetingAgentStore()
      : createDefaultMeetingAgentStore())
  const meetingTransport =
    dependencies.meetingTransport ?? createMeetingTransportFromEnv()
  const router = new Hono()

  router.post(
    "/api/workspace/:orgSlug/meeting-agent/runs",
    zValidator("json", meetingAgentRunCreateSchema),
    async (context) => {
      const orgSlug = context.req.param("orgSlug")
      const request = context.req.valid("json")
      const createdRun = await store.createRun({
        orgSlug,
        status: "queued",
        meetingUrl: request.meetingUrl,
        botName: request.botName ?? DEFAULT_MEETING_AGENT_BOT_NAME,
        meetingPurpose: request.meetingPurpose,
      })

      const meetingBot = await meetingTransport.createBot({
        runId: createdRun.id,
        meetingUrl: createdRun.meetingUrl,
        botName: createdRun.botName,
        meetingPurpose: createdRun.meetingPurpose,
      })

      const run =
        (await store.updateRun(createdRun.id, {
          status: meetingBot.status,
          meetingBaasBotId: meetingBot.externalBotId,
        })) ?? createdRun

      return context.json(
        {
          run,
          nextStep: "meeting_transport_started",
        },
        202,
      )
    },
  )

  router.get("/api/workspace/:orgSlug/meeting-agent/runs", async (context) => {
    return context.json(
      {
        runs: await store.listRuns(context.req.param("orgSlug")),
      },
      200,
    )
  })

  router.get(
    "/api/workspace/:orgSlug/meeting-agent/runs/:runId",
    async (context) => {
      const run = await store.getRun(
        context.req.param("orgSlug"),
        context.req.param("runId"),
      )

      if (!run) {
        return context.json({ error: "Meeting agent run not found" }, 404)
      }

      return context.json(
        {
          run,
          latestState: null,
          recentEvents: [],
          transcriptSegments: [],
          delegations: [],
        },
        200,
      )
    },
  )

  router.post(
    "/api/workspace/:orgSlug/meeting-agent/runs/:runId/stop",
    (context) => {
      return context.json(
        {
          accepted: true,
          runId: context.req.param("runId"),
        },
        202,
      )
    },
  )

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
