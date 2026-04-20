import { Hono } from "hono"

import {
  renderMeetingRunDetailPage,
  renderMeetingsPage,
} from "../features/meeting-agent/render"

export function createWebApp() {
  return new Hono()
    .get("/:orgSlug/meetings", (context) => {
      return context.html(
        renderMeetingsPage({
          orgSlug: context.req.param("orgSlug"),
          apiBaseUrl: getApiBaseUrl(),
        }),
      )
    })
    .get("/:orgSlug/meetings/:runId", (context) => {
      return context.html(
        renderMeetingRunDetailPage({
          orgSlug: context.req.param("orgSlug"),
          runId: context.req.param("runId"),
          apiBaseUrl: getApiBaseUrl(),
        }),
      )
    })
}

function getApiBaseUrl() {
  return process.env.API_BASE_URL ?? "http://localhost:3002"
}
