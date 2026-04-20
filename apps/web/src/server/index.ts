import { createWebApp } from "./app"

const port = Number.parseInt(process.env.WEB_PORT ?? "3000", 10)
const app = createWebApp()

console.info(`[web] starting on :${port}`)

export default {
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port,
}
