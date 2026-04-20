# First Increment Plan

## Objective

Build the MeetingBaas meeting-agent PoC as testable vertical slices. Every slice
must preserve a runnable path through the product boundary and end with a green
gate, commit, and push.

## Working Rule

Each implementation slice should move this path forward:

```text
UI or curl -> apps/api -> persistence -> sidecar/worker/provider boundary -> API detail response
```

Avoid isolated infrastructure work unless it directly supports the next
testable vertical path.

## Vertical Slices

### 0. Repository Foundation - Done

- Bun workspace layout.
- `apps/api`, `apps/worker`, `apps/web`, `apps/meeting-agent`.
- `packages/features/meeting-agent`.
- Package-level `format`, `lint`, `test`, and `build` gates.
- Shared meeting-agent contracts and initial speech-policy types.

### 1. Local Skeleton Slice - Next

Goal: every service runs, the API can create a fake meeting run, and the sidecar
boundary is exercised without real MeetingBaas.

- Add in-memory meeting-run store in `apps/api`.
- Implement:
  - `POST /api/workspace/:orgSlug/meeting-agent/runs`
  - `GET /api/workspace/:orgSlug/meeting-agent/runs`
  - `GET /api/workspace/:orgSlug/meeting-agent/runs/:runId`
- Add fake sidecar client in API.
- Add fake session endpoint in `apps/meeting-agent`.
- Create run should call the fake sidecar and return a run with observable
  status.

Testable outcome:

- Curl can create a fake meeting run.
- Curl can fetch the same run detail.
- No DB or MeetingBaas required.

### 2. Persistent Run Slice

Goal: meeting runs survive process restart.

- Add first persistence boundary for `meeting_agent_runs`.
- Add schema/migration owner for the run table.
- Add repository/data-access layer.
- Keep in-memory repository as test/default fallback where appropriate.
- API create/list/detail routes use the repository abstraction.

Testable outcome:

- Create a run.
- Restart API.
- Fetch the same run from persistent storage.
- Repository tests cover persistence behavior.

### 3. MeetingBaas Create-Bot Slice

Goal: a real hosted MeetingBaas bot can be added to a meeting.

- Add `MeetingTransport` interface.
- Add fake transport for tests and local dev.
- Add hosted MeetingBaas transport for real API calls.
- API create route persists run, calls transport, stores
  `meeting_baas_bot_id`, and returns `joining`.
- Add `MEETINGBAAS_API_KEY` only when this code path exists.

Testable outcome:

- With `MEETINGBAAS_API_KEY`, a real Google Meet/Zoom/Teams URL can receive an
  `Otto Meeting Agent` participant.
- Without the key, fake mode remains testable.

### 4. Lifecycle Event Slice

Goal: provider lifecycle events update the run and produce an event timeline.

- Add `meeting_agent_events`.
- Implement:
  - `POST /api/webhooks/meetingbaas`
  - `POST /api/webhooks/meetingbaas/callback/:runId`
- Persist raw event first.
- Map status events onto run status.
- Make duplicate events safe.

Testable outcome:

- Fixture webhook updates run status.
- Duplicate webhook does not corrupt state.
- Run detail returns recent events.

### 5. Live Transcript And State Slice

Goal: fake sidecar can push live transcript and meeting-description updates.

- Add `meeting_agent_transcript_segments`.
- Add `meeting_agent_state_snapshots`.
- Implement signed sidecar event ingest.
- Fake sidecar emits transcript/state events on demand or interval.
- Run detail returns latest state and recent transcript.

Testable outcome:

- Start fake run.
- Push or generate transcript/state events.
- API detail shows current topic, summary, open questions, and recent turns.

### 6. Minimal Web UI Slice

Goal: user can start and observe a fake or real run from the browser.

- Add `/:orgSlug/meetings`.
- Add `/:orgSlug/meetings/:runId`.
- Start form: meeting URL, bot name, purpose.
- Detail view: status, live description, recent transcript, events, and
  provider bot id.
- Use polling before websockets.

Testable outcome:

- Open browser.
- Start run.
- Land on run detail.
- See status and live description update.

## Later Slices

### 7. Conservative Speech Policy Slice

- Persist speech-decision events.
- Default to direct question or explicit invitation only.

### 8. Delegation Stub Slice

- Add `meeting_agent_delegations`.
- Fake Otto responder returns delayed answer.
- Sidecar polls and emits spoken-answer event.

### 9. Real Otto/OpenClaw Delegation Slice

- Reuse workspace-chat style hidden/system conversation.
- Route meeting question through existing Otto/OpenClaw path.

### 10. Artifact Ingest Slice

- Add `meeting_agent_artifacts`.
- Worker downloads MeetingBaas artifacts before presigned URLs expire.

### 11. Stop And Timeout Slice

- Stop action.
- Stale run timeout.
- Sidecar heartbeat handling.

### 12. Real Speaking Sidecar Slice

- Hosted MeetingBaas speaking bot first if hooks are sufficient.
- Fork/wrap MeetingBaas speaking bot only if hosted hooks block delegation or
  live event emission.

## Slice 6 Acceptance Target

- `bun run check` passes.
- User can create a fake meeting-agent run from the web UI.
- API detail returns the created run, recent events, transcript, and latest
  meeting state.
- Code is committed and pushed after every completed slice.
