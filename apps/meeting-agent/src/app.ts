import { Hono } from "hono"

export function createMeetingAgentSidecarApp() {
  return new Hono()
    .get("/healthz", (context) => {
      return context.json(
        {
          ok: true,
          service: "meeting-agent",
        },
        200,
        {
          "Cache-Control": "no-store",
        },
      )
    })
    .post("/sessions", async (context) => {
      const payload = await context.req.json().catch(() => ({}))

      return context.json(
        {
          accepted: true,
          provider: "meetingbaas_hosted",
          payload,
        },
        202,
      )
    })
}
