import { describe, expect, test } from "vitest"

import { meetingAgentRoutes } from "./routes"

describe("meeting-agent web routes", () => {
  test("keeps the PoC routes under workspace meetings", () => {
    expect(meetingAgentRoutes).toEqual({
      list: "/:orgSlug/meetings",
      detail: "/:orgSlug/meetings/:runId",
    })
  })
})
