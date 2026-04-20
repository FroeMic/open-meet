# First Increment Plan

## Objective

Build the smallest useful meeting-agent PoC around hosted MeetingBaas and the
existing Otto/OpenClaw delegation shape.

## Slices

1. Repository foundation
   - Create Bun workspace layout with `apps/api`, `apps/worker`, `apps/web`,
     `apps/meeting-agent`, and `packages/features/meeting-agent`.
   - Add package-level `format`, `lint`, `test`, and `build` gates.
   - Add shared meeting-agent contracts and conservative speech-policy types.

2. Data model and persistence
   - Add Drizzle schema and migration for `meeting_agent_runs`,
     `meeting_agent_events`, `meeting_agent_transcript_segments`,
     `meeting_agent_state_snapshots`, `meeting_agent_delegations`, and
     `meeting_agent_artifacts`.
   - Define idempotency constraints for provider events and transcript segments.

3. Workspace API MVP
   - Implement `POST /api/workspace/:orgSlug/meeting-agent/runs`.
   - Implement run list/detail endpoints.
   - Keep request handlers thin and call MeetingBaas through a provider
     interface.

4. MeetingBaas webhook and callbacks
   - Implement `POST /api/webhooks/meetingbaas` with SVIX verification.
   - Implement `POST /api/webhooks/meetingbaas/callback/:runId` with
     `x-mb-secret`.
   - Persist raw events before updating derived tables.

5. Sidecar callback loop
   - Implement signed sidecar event ingest at
     `/api/internal/meeting-agent/runs/:runId/events`.
   - Implement delegation create/status endpoints.
   - Let the sidecar poll delegation status before adding SSE or websockets.

6. Worker jobs
   - Add MeetingBaas status repair, artifact ingest, stop, and timeout jobs.
   - Download presigned artifacts promptly into repo-owned storage abstraction.

7. Workspace UI
   - Add `/:orgSlug/meetings` and `/:orgSlug/meetings/:runId`.
   - Start with a form, status rail, live description, recent transcript,
     delegation panel, and stop action.

8. Voice provider evaluation
   - Keep sidecar provider selection behind config.
   - Validate `meetingbaas_hosted` first.
   - Evaluate `xai_voice` and `openai_realtime` only after the hosted path
     proves where custom callbacks are blocked.

## Acceptance Criteria

- A developer can run all package gates with `bun run check`.
- A user can start a meeting run from the workspace UI.
- The run records lifecycle events, transcript/state updates, and a delegation
  trace.
- The sidecar speaks only under the conservative policy: direct question or
  explicit invitation.
- Completed runs retain normalized artifacts after MeetingBaas presigned URLs
  expire.
