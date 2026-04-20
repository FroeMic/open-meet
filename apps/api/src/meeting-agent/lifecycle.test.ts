import { describe, expect, test } from "vitest"

import {
  getMeetingBaasBotId,
  getMeetingBaasEventId,
  mapMeetingBaasRunStatus,
} from "./lifecycle"

describe("MeetingBaas lifecycle normalization", () => {
  test("extracts event and bot ids from common payload shapes", () => {
    expect(getMeetingBaasEventId({ id: "evt_123" })).toBe("evt_123")
    expect(getMeetingBaasBotId({ bot: { id: "bot_123" } })).toBe("bot_123")
    expect(getMeetingBaasBotId({ data: { bot_id: "bot_456" } })).toBe("bot_456")
  })

  test("maps provider statuses onto run statuses", () => {
    expect(mapMeetingBaasRunStatus("bot.status_change", "in_call")).toBe(
      "joined",
    )
    expect(mapMeetingBaasRunStatus("bot.completed", "done")).toBe("finished")
    expect(mapMeetingBaasRunStatus("bot.failed", "error")).toBe("failed")
  })
})
