import { describe, expect, test } from "vitest"

import { renderMeetingRunDetailPage, renderMeetingsPage } from "./render"

describe("meeting-agent page rendering", () => {
  test("renders the meetings start form", () => {
    expect(
      renderMeetingsPage({
        orgSlug: "acme",
        apiBaseUrl: "http://localhost:7102",
      }),
    ).toContain("Start meeting agent")
  })

  test("renders the detail polling shell", () => {
    expect(
      renderMeetingRunDetailPage({
        orgSlug: "acme",
        runId: "run_123",
        apiBaseUrl: "http://localhost:7102",
      }),
    ).toContain('data-run-id="run_123"')
  })
})
