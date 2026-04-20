import type {
  CreateStateSnapshotInput,
  CreateTranscriptSegmentInput,
} from "./store"

export function transcriptSegmentFromPayload(
  runId: string,
  payload: Record<string, unknown>,
): CreateTranscriptSegmentInput | null {
  const text = getString(payload.text)

  if (!text) {
    return null
  }

  return {
    runId,
    source: "sidecar",
    speakerName:
      getString(payload.speakerName) ?? getString(payload.speaker_name),
    text,
    startSeconds:
      getNumber(payload.startSeconds) ?? getNumber(payload.start_seconds),
    endSeconds: getNumber(payload.endSeconds) ?? getNumber(payload.end_seconds),
    confidence: getNumber(payload.confidence),
    isFinal:
      getBoolean(payload.isFinal) ?? getBoolean(payload.is_final) ?? false,
    externalSegmentId:
      getString(payload.externalSegmentId) ?? getString(payload.segment_id),
    payload,
  }
}

export function stateSnapshotFromPayload(
  runId: string,
  payload: Record<string, unknown>,
): CreateStateSnapshotInput | null {
  const summary = getString(payload.summary)

  if (summary === undefined) {
    return null
  }

  return {
    runId,
    summary,
    currentTopic:
      getString(payload.currentTopic) ?? getString(payload.current_topic),
    openQuestions:
      getStringArray(payload.openQuestions) ??
      getStringArray(payload.open_questions),
    decisions: getStringArray(payload.decisions),
    actionItems:
      getStringArray(payload.actionItems) ??
      getStringArray(payload.action_items),
    recentContext:
      getStringArray(payload.recentContext) ??
      getStringArray(payload.recent_context),
  }
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function getBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function getStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value.filter((item): item is string => typeof item === "string")
}
