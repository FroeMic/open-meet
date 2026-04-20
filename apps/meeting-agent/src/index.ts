import { createMeetingAgentSidecarApp } from "./app"

const port = Number.parseInt(process.env.MEETING_AGENT_PORT ?? "3010", 10)
const app = createMeetingAgentSidecarApp()

console.info(`[meeting-agent] starting on :${port}`)

export default {
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port,
}
