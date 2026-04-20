import { Hono } from "hono"
import { logger } from "hono/logger"

import { createMeetingAgentRouter } from "./meeting-agent/routes"

export function createApiApp() {
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
    .route("/", createMeetingAgentRouter())

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
