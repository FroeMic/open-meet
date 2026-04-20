import type {
  MeetingAgentEventType,
  MeetingAgentRunStatus,
} from "@open-meet/feature-meeting-agent"

export function getMeetingBaasEventType(
  payload: unknown,
): MeetingAgentEventType {
  const eventType = getNestedString(payload, ["type", "event", "event_type"])

  if (eventType === "bot.completed") {
    return "bot_completed"
  }

  if (eventType === "bot.failed") {
    return "bot_failed"
  }

  return "bot_status_changed"
}

export function getMeetingBaasEventId(payload: unknown): string | undefined {
  return getNestedString(payload, ["id", "event_id", "eventId"])
}

export function getMeetingBaasBotId(payload: unknown): string | undefined {
  return getNestedString(payload, [
    "bot_id",
    "botId",
    "bot.id",
    "bot.uuid",
    "data.bot_id",
    "data.bot.id",
  ])
}

export function getMeetingBaasStatus(payload: unknown): string | undefined {
  return getNestedString(payload, [
    "status",
    "bot_status",
    "bot.status",
    "data.status",
    "data.bot.status",
  ])
}

export function mapMeetingBaasRunStatus(
  providerEventType: string | undefined,
  providerStatus: string | undefined,
): MeetingAgentRunStatus | undefined {
  if (providerEventType === "bot.completed") {
    return "finished"
  }

  if (providerEventType === "bot.failed") {
    return "failed"
  }

  switch (providerStatus) {
    case "joining":
    case "waiting":
      return "joining"
    case "in_call":
    case "joined":
      return "joined"
    case "completed":
    case "done":
      return "finished"
    case "failed":
    case "error":
      return "failed"
    default:
      return undefined
  }
}

function getNestedString(
  payload: unknown,
  paths: string[],
): string | undefined {
  for (const path of paths) {
    const value = getPath(payload, path)

    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  return undefined
}

function getPath(payload: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((currentValue, key) => {
    if (
      typeof currentValue !== "object" ||
      currentValue === null ||
      !(key in currentValue)
    ) {
      return undefined
    }

    return (currentValue as Record<string, unknown>)[key]
  }, payload)
}
