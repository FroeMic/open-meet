import { z } from "zod"

export const DEFAULT_MEETING_AGENT_BOT_NAME = "Otto Meeting Agent"

export const meetingAgentRunStatusSchema = z.enum([
  "queued",
  "waiting",
  "joining",
  "joined",
  "listening",
  "speaking",
  "asking_otto",
  "finished",
  "failed",
  "stopped",
])

export type MeetingAgentRunStatus = z.infer<typeof meetingAgentRunStatusSchema>

export const meetingProviderSchema = z.enum([
  "google_meet",
  "zoom",
  "microsoft_teams",
  "unknown",
])

export type MeetingProvider = z.infer<typeof meetingProviderSchema>

export const speechModeSchema = z.enum([
  "direct_or_invited",
  "direct_only",
  "proactive_when_allowed",
])

export type SpeechMode = z.infer<typeof speechModeSchema>

export const staticInitializationSchema = z.object({
  agentName: z.string().min(1).default(DEFAULT_MEETING_AGENT_BOT_NAME),
  workspaceName: z.string().min(1).optional(),
  meetingPurpose: z.string().min(1).optional(),
  voiceStyle: z
    .string()
    .min(1)
    .default("concise, calm, interrupt only when invited"),
  allowedSpeechModes: z
    .array(z.enum(["direct_question", "explicit_invitation", "proactive_help"]))
    .default(["direct_question", "explicit_invitation"]),
  ottoInstructions: z
    .string()
    .min(1)
    .default(
      "Use Otto as the main brain for workspace history, tools, and research.",
    ),
  knownContext: z.array(z.string().min(1)).default([]),
})

export type StaticInitialization = z.infer<typeof staticInitializationSchema>

export const meetingAgentRunCreateSchema = z.object({
  meetingUrl: z.url(),
  botName: z.string().min(1).default(DEFAULT_MEETING_AGENT_BOT_NAME),
  meetingPurpose: z.string().min(1).optional(),
  speechMode: speechModeSchema.default("direct_or_invited"),
  staticContext: staticInitializationSchema.partial().optional(),
})

export type MeetingAgentRunCreate = z.infer<typeof meetingAgentRunCreateSchema>

export const meetingAgentRunSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  status: meetingAgentRunStatusSchema,
  meetingUrl: z.url(),
  meetingProvider: meetingProviderSchema.default("unknown"),
  meetingTitle: z.string().min(1).optional(),
  botName: z.string().min(1),
  meetingBaasBotId: z.string().min(1).optional(),
  sidecarSessionId: z.string().min(1).optional(),
  lastErrorMessage: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type MeetingAgentRun = z.infer<typeof meetingAgentRunSchema>

export const meetingAgentEventTypeSchema = z.enum([
  "bot_status_changed",
  "bot_completed",
  "bot_failed",
  "chat_message",
  "transcript_delta",
  "state_snapshot",
  "speech_decision",
  "spoken_utterance",
  "delegation_started",
  "delegation_completed",
  "delegation_failed",
  "sidecar_health",
])

export type MeetingAgentEventType = z.infer<typeof meetingAgentEventTypeSchema>

export const meetingAgentEventSchema = z.object({
  runId: z.string().min(1),
  eventType: meetingAgentEventTypeSchema,
  source: z.enum(["meetingbaas", "sidecar", "api", "worker", "otto"]),
  externalEventId: z.string().min(1).optional(),
  occurredAt: z.string().datetime(),
  payload: z.record(z.string(), z.unknown()).default({}),
})

export type MeetingAgentEvent = z.infer<typeof meetingAgentEventSchema>

export const meetingAgentStateSnapshotSchema = z.object({
  runId: z.string().min(1),
  summary: z.string().default(""),
  currentTopic: z.string().optional(),
  openQuestions: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  actionItems: z.array(z.string()).default([]),
  recentContext: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
})

export type MeetingAgentStateSnapshot = z.infer<
  typeof meetingAgentStateSnapshotSchema
>

export const speechPolicyInputSchema = z.object({
  currentStatus: meetingAgentRunStatusSchema,
  directAddress: z.boolean(),
  explicitInvitation: z.boolean(),
  lastSpeakerIsAgent: z.boolean(),
  secondsSinceLastAgentSpeech: z.number().nonnegative(),
  question: z.string().default(""),
  allowedSpeechModes: z.array(
    z.enum(["direct_question", "explicit_invitation", "proactive_help"]),
  ),
})

export type SpeechPolicyInput = z.infer<typeof speechPolicyInputSchema>

export const speechPolicyDecisionSchema = z.enum([
  "stay_silent",
  "send_chat_only",
  "speak_short_answer",
  "ask_clarifying_question",
  "delegate_to_otto",
])

export type SpeechPolicyDecision = z.infer<typeof speechPolicyDecisionSchema>

export function shouldDelegateToOtto(input: SpeechPolicyInput): boolean {
  const normalizedQuestion = input.question.toLowerCase()
  const asksForWorkspaceDepth =
    normalizedQuestion.includes("workspace") ||
    normalizedQuestion.includes("history") ||
    normalizedQuestion.includes("research") ||
    normalizedQuestion.includes("check with otto") ||
    normalizedQuestion.includes("ask otto")

  return (
    (input.directAddress || input.explicitInvitation) &&
    input.currentStatus === "joined" &&
    !input.lastSpeakerIsAgent &&
    input.secondsSinceLastAgentSpeech >= 10 &&
    asksForWorkspaceDepth
  )
}
