import { describe, expect, test } from "vitest"

import { renderMeetingRunDetailPage, renderMeetingsPage } from "./render"

describe("meeting-agent page rendering", () => {
  test("renders the meetings start form", () => {
    expect(
      renderMeetingsPage({
        orgSlug: "acme",
        apiBaseUrl: "http://localhost:3002",
      }),
    ).toContain("Start meeting agent")
  })

  test("renders the detail polling shell", () => {
    expect(
      renderMeetingRunDetailPage({
        orgSlug: "acme",
        runId: "run_123",
        apiBaseUrl: "http://localhost:3002",
      }),
    ).toContain('data-run-id="run_123"')
  })
})
