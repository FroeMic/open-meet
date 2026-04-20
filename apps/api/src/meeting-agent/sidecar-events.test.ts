import { describe, expect, test } from "vitest"

import {
  stateSnapshotFromPayload,
  transcriptSegmentFromPayload,
} from "./sidecar-events"

describe("sidecar event normalization", () => {
  test("normalizes transcript payloads", () => {
    expect(
      transcriptSegmentFromPayload("run_123", {
        text: "Can Otto check that?",
        speaker_name: "Mia",
        segment_id: "seg_1",
        is_final: true,
      }),
    ).toMatchObject({
      runId: "run_123",
      text: "Can Otto check that?",
      speakerName: "Mia",
      externalSegmentId: "seg_1",
      isFinal: true,
    })
  })

  test("normalizes state snapshot payloads", () => {
    expect(
      stateSnapshotFromPayload("run_123", {
        summary: "Discussing launch risk.",
        current_topic: "Launch risk",
        open_questions: ["Who owns follow-up?"],
      }),
    ).toMatchObject({
      runId: "run_123",
      summary: "Discussing launch risk.",
      currentTopic: "Launch risk",
      openQuestions: ["Who owns follow-up?"],
    })
  })
})
