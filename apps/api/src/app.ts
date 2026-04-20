import { Hono } from "hono"
import { logger } from "hono/logger"

import {
  createMeetingAgentRouter,
  type MeetingAgentRouterDependencies,
} from "./meeting-agent/routes"

export interface CreateApiAppOptions {
  meetingAgent?: Partial<MeetingAgentRouterDependencies>
}

export function createApiApp(options: CreateApiAppOptions = {}) {
  const app = new Hono()
    .use("*", logger())
    .get("/healthz", (context) => {
      return context.json(
        {
          ok: true,
          service: "api",
        },
        200,
        {
          "Cache-Control": "no-store",
        },
      )
    })
    .route("/", createMeetingAgentRouter(options.meetingAgent))

  app.notFound((context) => {
    return context.json(
      {
        error: "Not found",
      },
      404,
      {
        "Cache-Control": "no-store",
      },
    )
  })

  return app
}

export type AppType = ReturnType<typeof createApiApp>
