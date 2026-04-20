import { describe, expect, test } from "vitest"

import { createWebApp } from "./app"

describe("web app", () => {
  test("serves the workspace meetings placeholder", async () => {
    const response = await createWebApp().request("/acme/meetings")

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toContain("Meeting agent")
  })

  test("serves the meeting run detail placeholder", async () => {
    const response = await createWebApp().request("/acme/meetings/run_123")

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toContain('data-run-id="run_123"')
  })
})
