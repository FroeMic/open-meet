import type { MeetingAgentRunStatus } from "@open-meet/feature-meeting-agent"

export interface CreateMeetingBotInput {
  runId: string
  meetingUrl: string
  botName: string
  meetingPurpose?: string
}

export interface CreateMeetingBotResult {
  provider: "fake" | "meetingbaas_hosted"
  externalBotId: string
  status: Extract<MeetingAgentRunStatus, "joining" | "failed">
}

export interface MeetingTransport {
  createBot(input: CreateMeetingBotInput): Promise<CreateMeetingBotResult>
}

export type MeetingTransportFetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>

export function createFakeMeetingTransport(): MeetingTransport {
  return {
    async createBot(input) {
      return {
        provider: "fake",
        externalBotId: `fake_bot_${input.runId}`,
        status: "joining",
      }
    },
  }
}

export interface CreateMeetingBaasTransportOptions {
  apiKey: string
  baseUrl?: string
  fetcher?: MeetingTransportFetcher
}

export function createMeetingBaasTransport(
  options: CreateMeetingBaasTransportOptions,
): MeetingTransport {
  const baseUrl = options.baseUrl ?? "https://api.meetingbaas.com/v2"
  const fetcher: MeetingTransportFetcher = options.fetcher ?? fetch

  return {
    async createBot(input) {
      const response = await fetcher(`${baseUrl}/bots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-meeting-baas-api-key": options.apiKey,
        },
        body: JSON.stringify({
          meeting_url: input.meetingUrl,
          bot_name: input.botName,
          entry_message: `Hi, I am ${input.botName}. I will listen quietly unless invited.`,
          transcription_enabled: true,
          recording_mode: "speaker_view",
          callback_enabled: false,
          extra: {
            open_meet_run_id: input.runId,
            meeting_purpose: input.meetingPurpose,
          },
        }),
      })

      const body = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >

      if (!response.ok) {
        throw new Error(
          `MeetingBaas bot create failed with ${response.status}: ${JSON.stringify(body)}`,
        )
      }

      const externalBotId =
        getString(body.bot_id) ?? getString(body.id) ?? getString(body.uuid)

      if (!externalBotId) {
        throw new Error(
          "MeetingBaas bot create response did not include a bot id",
        )
      }

      return {
        provider: "meetingbaas_hosted",
        externalBotId,
        status: "joining",
      }
    },
  }
}

export function createMeetingTransportFromEnv(): MeetingTransport {
  const apiKey = process.env.MEETINGBAAS_API_KEY

  if (!apiKey) {
    return createFakeMeetingTransport()
  }

  return createMeetingBaasTransport({
    apiKey,
    baseUrl: process.env.MEETINGBAAS_BASE_URL,
  })
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}
