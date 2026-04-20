import { describe, expect, test } from "vitest"

import {
  DEFAULT_MEETING_AGENT_BOT_NAME,
  meetingAgentRunCreateSchema,
  meetingAgentRunStatusSchema,
  shouldDelegateToOtto,
  speechPolicyInputSchema,
} from "./index"

describe("meeting-agent contracts", () => {
  test("accepts a minimal start-run request and applies the default bot name", () => {
    const request = meetingAgentRunCreateSchema.parse({
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    })

    expect(request.botName).toBe(DEFAULT_MEETING_AGENT_BOT_NAME)
    expect(request.speechMode).toBe("direct_or_invited")
  })

  test("rejects unsupported run statuses", () => {
    const parsed = meetingAgentRunStatusSchema.safeParse("teleporting")

    expect(parsed.success).toBe(false)
  })

  test("delegates slow workspace questions to Otto", () => {
    const input = speechPolicyInputSchema.parse({
      currentStatus: "joined",
      directAddress: true,
      explicitInvitation: true,
      lastSpeakerIsAgent: false,
      secondsSinceLastAgentSpeech: 120,
      question:
        "Otto, can you check our workspace history for the last launch decision?",
      allowedSpeechModes: ["direct_question", "explicit_invitation"],
    })

    expect(shouldDelegateToOtto(input)).toBe(true)
  })
})
