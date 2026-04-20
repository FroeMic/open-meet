import type { MeetingAgentRunStatus } from "@open-meet/feature-meeting-agent"

export interface StartMeetingAgentSessionInput {
  runId: string
  orgSlug: string
  meetingUrl: string
  botName: string
  meetingPurpose?: string
}

export interface StartMeetingAgentSessionResult {
  provider: "fake" | "meetingbaas_hosted"
  sidecarSessionId: string
  status: Extract<MeetingAgentRunStatus, "joining" | "failed">
}

export interface MeetingAgentSidecarClient {
  startSession(
    input: StartMeetingAgentSessionInput,
  ): Promise<StartMeetingAgentSessionResult>
}

export function createFakeMeetingAgentSidecarClient(): MeetingAgentSidecarClient {
  return {
    async startSession(input) {
      return {
        provider: "fake",
        sidecarSessionId: `fake_${input.runId}`,
        status: "joining",
      }
    },
  }
}
