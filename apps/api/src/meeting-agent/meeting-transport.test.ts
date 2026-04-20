import { describe, expect, test } from "vitest"

import {
  createFakeMeetingTransport,
  createMeetingBaasTransport,
} from "./meeting-transport"

describe("meeting transport", () => {
  test("creates fake bots in local mode", async () => {
    const transport = createFakeMeetingTransport()

    await expect(
      transport.createBot({
        runId: "run_123",
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        botName: "Otto Meeting Agent",
      }),
    ).resolves.toEqual({
      provider: "fake",
      externalBotId: "fake_bot_run_123",
      status: "joining",
    })
  })

  test("posts a hosted MeetingBaas v2 bot request", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = []
    const transport = createMeetingBaasTransport({
      apiKey: "test-key",
      baseUrl: "https://api.meetingbaas.test/v2",
      fetcher: async (url, init) => {
        requests.push({ url: String(url), init: init ?? {} })

        return new Response(JSON.stringify({ bot_id: "bot_123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      },
    })

    await expect(
      transport.createBot({
        runId: "run_123",
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        botName: "Otto Meeting Agent",
        meetingPurpose: "Product sync",
      }),
    ).resolves.toEqual({
      provider: "meetingbaas_hosted",
      externalBotId: "bot_123",
      status: "joining",
    })

    expect(requests).toHaveLength(1)
    expect(requests[0]?.url).toBe("https://api.meetingbaas.test/v2/bots")
    expect(requests[0]?.init.headers).toMatchObject({
      "Content-Type": "application/json",
      "x-meeting-baas-api-key": "test-key",
    })
    expect(JSON.parse(String(requests[0]?.init.body))).toMatchObject({
      meeting_url: "https://meet.google.com/abc-defg-hij",
      bot_name: "Otto Meeting Agent",
      entry_message:
        "Hi, I am Otto Meeting Agent. I will listen quietly unless invited.",
      transcription_enabled: true,
    })
  })
})
