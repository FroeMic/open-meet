# TODO 36: Meeting Agent PoC With MeetingBaas

## Goal

Build a proof of concept for a live meeting agent that can join a Google Meet,
Zoom, or Microsoft Teams meeting through MeetingBaas, maintain a live
description of the meeting, speak in the meeting, and delegate deeper reasoning
or research to the tenant's slower Otto/OpenClaw agent.

The PoC should prove this loop:

1. A user starts a meeting agent for a meeting URL from the workspace.
2. A named meeting participant joins through MeetingBaas with static persona and
   workspace context.
3. The meeting agent listens and maintains live transcript/state.
4. The meeting agent decides when to answer locally, when to stay silent, and
   when to ask Otto/OpenClaw for a deeper answer.
5. Otto/OpenClaw returns a result through the existing tenant runtime path.
6. The meeting agent speaks a concise answer back into the meeting.
7. The workspace stores the meeting run, transcript snapshots, assistant
   utterances, and OpenClaw delegation trace for review.

## Product Shape

The first product should feel like a small Circleback-style meeting participant,
not like a generic developer bot.

Initial user-facing capabilities:

- start a live meeting agent from a pasted meeting URL
- choose or accept the default meeting agent identity
- see whether the agent is waiting, joined, speaking, asking Otto, or finished
- review a live-updating meeting description while the meeting is running
- review post-meeting transcript, participants, chat messages, and delegation log

Initial agent behavior:

- joins as a normal named participant, for example `Otto Meeting Agent`
- introduces itself with a short entry message
- listens by default
- speaks only when directly addressed, when explicitly invited, or when the
  configured meeting policy allows proactive help
- uses static initialization context for identity, style, workspace scope, and
  meeting purpose
- delegates slow, tool-heavy, or memory-heavy questions to the tenant
  Otto/OpenClaw runtime
- speaks back only a short answer unless the meeting asks for more detail

## Scope

In scope for the PoC:

- MeetingBaas integration as the meeting transport
- one manual "start meeting agent" workspace action
- hosted MeetingBaas API first, with an abstraction that can later point at a
  self-hosted MeetingBaas deployment
- a small meeting-agent service or sidecar, likely Python/FastAPI/Pipecat based,
  derived from MeetingBaas' open-source speaking bot shape
- live transcript and meeting-state ingestion into the control plane
- a live "meeting described" state model:
  - current topic
  - recent speaker turns
  - notable facts
  - open questions
  - action items
  - screen or slide notes if available
- static meeting-agent initialization from workspace and request-level context
- a narrow OpenClaw delegation bridge that reuses the existing workspace-chat
  tenant ingress path where possible
- text-to-speech output from the meeting-agent service back into the meeting
- post-meeting artifact download and normalization
- basic audit and safety gates for meeting speech

Out of scope for the PoC:

- full calendar auto-join
- production self-hosting of MeetingBaas
- recording consent automation beyond visible bot naming and entry message
- multi-language meeting support
- custom voice cloning
- user-specific per-participant authorization
- automatic sales/reservation phone calls
- a full meeting-memory search product
- replacing the existing Otto/OpenClaw runtime with the meeting sidecar

## Dependencies

- `TODO_14_session_history_visibility.md`
- `TODO_16_runtime_ai_provider_proxy.md`
- `TODO_17_managed_integrations_architecture.md`
- `TODO_20_unified_frontend_and_hono_migration.md`
- `TODO_21_workspace_multiplayer_chat_and_web_channel.md`
- `TODO_26_managed_runtime_memory.md`

Useful existing implementation:

- `packages/features/workspace-chat`
- `apps/api/src/runtime/workspace-chat.ts`
- `apps/worker/src/runtime/lib/runtime/manager.ts`
- `runtime-plugins/otto-workspace-chat`
- `runtime-plugins/otto-session-reporter`
- `packages/features/runtime-core/src/sessions`

## MeetingBaas Research Notes

Current docs reviewed on 2026-04-19:

- MeetingBaas API v2 provides meeting bots for Google Meet, Zoom, and Microsoft
  Teams through one API.
- `POST https://api.meetingbaas.com/v2/bots` creates an immediate bot.
- `POST https://api.meetingbaas.com/v2/bots/scheduled` creates a scheduled bot.
- Bot creation supports:
  - `meeting_url`
  - `bot_name`
  - `bot_image`
  - `entry_message`
  - `recording_mode`
  - `transcription_enabled`
  - `transcription_config`
  - `callback_enabled`
  - `callback_config`
  - `timeout_config`
  - `allow_multiple_bots`
  - `extra`
  - `streaming_enabled`
  - `streaming_config`
- MeetingBaas webhooks use SVIX for account-level webhook delivery.
- Bot-specific callbacks can be configured per bot but only cover completion and
  failure.
- Webhook events include:
  - `bot.status_change`
  - `bot.completed`
  - `bot.failed`
  - `bot.chat_message`
  - calendar connection and calendar event events
- `bot.chat_message` is real-time and can trigger actions while the meeting is
  still running.
- Post-meeting artifacts include:
  - video
  - audio
  - standardized transcription JSON
  - raw transcription JSON
  - diarization JSONL
  - chat messages JSON
  - participants
  - speakers
- Artifact URLs are presigned and valid for 4 hours, so Otto must download
  needed artifacts promptly.
- Screenshots are available through the bot screenshots endpoint for Google Meet
  and Microsoft Teams; Zoom screenshots are not available through that endpoint.
- MeetingBaas has a hosted speaking bot API at
  `https://speaking.meetingbaas.com/bots`.
- The speaking bot API combines MeetingBaas with Pipecat and accepts:
  - `meeting_url`
  - `bot_name`
  - `personas`
  - `bot_image`
  - `entry_message`
  - `extra`
  - `enable_tools`
  - `prompt`
- MeetingBaas' speaking-bot docs describe bidirectional audio streaming,
  persona markdown, custom voices, VAD configuration, function tools, and LLM
  context management.
- MeetingBaas' self-hosted v2 architecture uses Kubernetes, API server,
  background jobs, bot pods, SQS, S3, PostgreSQL, Redis, and virtual video
  devices. That is too heavy for this PoC unless hosted APIs block required
  behavior.
- xAI's current Voice API is also a candidate provider for the meeting sidecar:
  - Voice Agent API: realtime voice conversations over WebSocket
  - Text to Speech API: five voices, multiple audio formats, telephony-oriented
    formats
  - Speech to Text API: batch, streaming, and bidirectional modes
  - docs mention SIP, WebSocket, and LiveKit connection options plus G.711
    μ-law/A-law codecs for telephony use cases
  - listed pricing on 2026-04-19:
    - Voice Agent API: `$0.05 / min` or `$3.00 / hr`
    - TTS: `$4.20 / 1M characters`
    - STT: `$0.10 / hr` batch, `$0.20 / hr` streaming
  - tool support includes function calling, web search, X search, collections,
    MCP, and custom functions, but tool usage may add charges beyond the
    per-minute voice cost

Primary sources:

- https://docs.meetingbaas.com/api-v2
- https://docs.meetingbaas.com/api-v2/getting-started/sending-a-bot
- https://docs.meetingbaas.com/api-v2/getting-started/getting-the-data
- https://docs.meetingbaas.com/api-v2/webhooks
- https://docs.meetingbaas.com/api-v2/artifacts
- https://docs.meetingbaas.com/speaking-bots
- https://speaking.meetingbaas.com/openapi.json
- https://docs.meetingbaas.com/self-hosting
- https://github.com/Meeting-Baas/speaking-meeting-bot
- https://x.ai/api/voice
- https://docs.x.ai/developers/model-capabilities/audio/voice
- https://docs.x.ai/developers/models

## Architecture Decision

Use MeetingBaas for meeting connectivity and media transport. Do not make
OpenClaw directly join video meetings.

Use a dedicated meeting-agent sidecar for realtime voice behavior:

- VAD
- live transcript context
- short local turn policy
- TTS
- meeting speech output
- fast state machine

Use Otto/OpenClaw as the deeper tenant brain:

- workspace-specific reasoning
- managed integrations
- long-horizon memory search
- tool-heavy research
- answer synthesis that benefits from the existing tenant runtime and
  instructions

The meeting sidecar is a realtime voice worker. Otto/OpenClaw remains the
agentic reasoning and tool runtime.

## Target Topology

```text
+--------------------------+
| Workspace UI            |
| start/review meeting    |
+------------+-------------+
             |
             v
+--------------------------+       +-----------------------------+
| apps/api                 |       | apps/worker                 |
| meeting runs, webhooks,  |<----->| artifact ingest, timeout,   |
| live events, status      |       | delegation jobs             |
+------------+-------------+       +--------------+--------------+
             |                                    |
             v                                    v
+--------------------------+       +-----------------------------+
| meeting-agent sidecar    |       | tenant OpenClaw runtime     |
| FastAPI/Pipecat          |       | otto-workspace-chat plugin  |
| live voice loop          |       | managed Otto tools/memory   |
+------------+-------------+       +--------------+--------------+
             |                                    ^
             v                                    |
+--------------------------+                      |
| MeetingBaas              |----------------------+
| hosted meeting bots      |
| Zoom/Meet/Teams          |
+--------------------------+
```

## Code Ownership

Follow the extracted repo layout:

- `apps/api/src/meeting-agent`
  - workspace-facing meeting-agent API routes
  - MeetingBaas webhook and callback routes
  - runtime-to-control-plane callback routes from the meeting sidecar
- `apps/worker/src/runtime/meeting-agent`
  - MeetingBaas polling repair jobs
  - post-meeting artifact download jobs
  - cleanup and timeout jobs
- `apps/web/src/features/meeting-agent`
  - start meeting agent page or panel
  - live meeting run detail
  - post-meeting review surface
- `packages/features/meeting-agent`
  - shared contracts, schemas, state normalizers, and DTOs
- `runtime-plugins/otto-workspace-chat`
  - preferred OpenClaw delegation target for PoC, not a new meeting-specific
    OpenClaw channel unless the existing workspace-chat semantics are
    insufficient
- `services/meeting-agent` or `apps/meeting-agent`
  - dedicated sidecar if it is checked into this repo
  - Python/Pipecat is acceptable here because MeetingBaas' speaking bot
    reference implementation is Python/Pipecat based

Do not put meeting-agent domain logic in generic `lib` or reuse `apps/gateway`
for realtime meeting media. The existing gateway is for integration execution,
not bidirectional meeting audio.

## Data Model

Add a meeting-agent domain schema. Exact table names may shift during
implementation, but keep the concepts separate from `tenant_sessions`.

### `meeting_agent_runs`

- `id`
- `organization_id`
- `tenant_id`
- `created_by_user_id`
- `status`
- `meeting_url`
- `meeting_provider`
- `meeting_title`
- `bot_name`
- `bot_image_url`
- `entry_message`
- `meeting_baas_bot_id`
- `meeting_baas_status`
- `sidecar_session_id`
- `started_at`
- `joined_at`
- `ended_at`
- `last_event_at`
- `last_error_code`
- `last_error_message`
- `static_context_json`
- `policy_json`
- `created_at`
- `updated_at`

### `meeting_agent_events`

- `id`
- `meeting_agent_run_id`
- `event_type`
- `source`
- `external_event_id`
- `sequence`
- `occurred_at`
- `payload_json`
- `created_at`

Use this for idempotent audit and replay of:

- bot lifecycle transitions
- transcript deltas
- meeting-state summaries
- chat messages
- speech decisions
- spoken utterances
- OpenClaw delegation starts, deltas, completions, and failures

### `meeting_agent_transcript_segments`

- `id`
- `meeting_agent_run_id`
- `source`
- `speaker_name`
- `speaker_external_id`
- `text`
- `start_seconds`
- `end_seconds`
- `confidence`
- `is_final`
- `external_segment_id`
- `payload_json`
- `created_at`

This table is for live and post-meeting transcript display. It should not be the
only audit source; keep raw provider payloads in `meeting_agent_events`.

### `meeting_agent_state_snapshots`

- `id`
- `meeting_agent_run_id`
- `sequence`
- `summary`
- `current_topic`
- `open_questions_json`
- `decisions_json`
- `action_items_json`
- `recent_context_json`
- `created_at`

This is the "meeting is live described" surface. It can be replaced frequently
and is not a full transcript.

### `meeting_agent_delegations`

- `id`
- `meeting_agent_run_id`
- `workspace_chat_conversation_id`
- `workspace_chat_user_message_id`
- `workspace_chat_assistant_message_id`
- `runtime_session_key`
- `trigger_reason`
- `question`
- `status`
- `started_at`
- `completed_at`
- `answer_text`
- `error_message`
- `created_at`
- `updated_at`

This table links a live meeting question to the slower Otto/OpenClaw run.

### `meeting_agent_artifacts`

- `id`
- `meeting_agent_run_id`
- `artifact_type`
- `source_url_expires_at`
- `storage_key`
- `content_type`
- `byte_size`
- `sha256`
- `status`
- `created_at`

Artifacts should be downloaded into Otto-owned storage promptly because
MeetingBaas presigned URLs expire.

## API Shape

### Workspace API

Use Hono RPC for browser-facing routes.

- `POST /api/workspace/:orgSlug/meeting-agent/runs`
  - creates a run and starts a MeetingBaas speaking bot
  - request includes meeting URL and optional persona overrides
  - response returns run id and initial status

- `GET /api/workspace/:orgSlug/meeting-agent/runs`
  - lists recent runs

- `GET /api/workspace/:orgSlug/meeting-agent/runs/:runId`
  - returns run, live state snapshot, recent events, transcript segments, and
    delegation status

- `POST /api/workspace/:orgSlug/meeting-agent/runs/:runId/stop`
  - asks the sidecar / MeetingBaas bot to leave

### MeetingBaas Webhook API

Plain HTTP route, not Hono RPC.

- `POST /api/webhooks/meetingbaas`
  - verifies SVIX headers for account-level webhooks
  - handles status changes, completion, failures, and chat messages
  - enqueues artifact ingest on `bot.completed`

### MeetingBaas Callback API

Plain HTTP route, not Hono RPC.

- `POST /api/webhooks/meetingbaas/callback/:runId`
  - verifies `x-mb-secret`
  - handles bot-specific completed/failed callbacks
  - mostly a fallback or simpler PoC route if account-level webhooks are not
    configured

### Meeting Sidecar Callback API

Plain HTTP route with signed sidecar auth.

- `POST /api/internal/meeting-agent/runs/:runId/events`
  - accepts transcript deltas, state snapshots, speech decisions, spoken output,
    and sidecar health events
  - writes `meeting_agent_events`
  - updates derived run/state tables

- `POST /api/internal/meeting-agent/runs/:runId/delegations`
  - asks Otto/OpenClaw a question on behalf of the meeting agent
  - returns delegation id and current state
  - internally creates or reuses a workspace-chat conversation and queues a
    normal `run_workspace_chat_turn`

- `GET /api/internal/meeting-agent/delegations/:delegationId`
  - sidecar polls or subscribes for answer status in the first PoC
  - returns partial/final answer text

Later, replace polling with websocket/SSE if needed.

## Meeting Sidecar

The sidecar is the realtime loop. It should be deployable independently from
`apps/api` and `apps/worker`.

Recommended PoC path:

1. Start from MeetingBaas' open-source `speaking-meeting-bot` architecture.
2. Replace or wrap the built-in generic tool examples with Otto callbacks.
3. Use `prompt` and/or persona markdown for static initialization.
4. Keep the sidecar responsible for speech and meeting turn-taking.
5. Keep the control plane responsible for persistence, policy, and OpenClaw
   delegation.

### Voice Provider Candidates

The sidecar should keep STT, TTS, and realtime speech-to-speech behind a small
provider interface. Do not bake one provider into meeting-agent domain logic.

Candidate providers for the PoC:

- MeetingBaas hosted speaking bot
  - fastest path if its hosted Pipecat pipeline exposes enough custom callback
    hooks for Otto delegation
  - least infrastructure to operate
- Otto-owned fork of MeetingBaas' speaking bot
  - preferred fallback if the hosted speaking API cannot call Otto tools or emit
    the live state events we need
  - lets us choose STT, TTS, VAD, LLM, and function-calling providers directly
- xAI Voice API
  - attractive on price for realtime voice and especially streaming STT
  - supports WebSocket realtime voice, separate TTS/STT endpoints, function
    calling, MCP, and telephony codecs
  - should be evaluated as a sidecar provider for either:
    - full realtime voice agent behavior
    - low-cost streaming STT
    - low-cost TTS output from OpenClaw answers
- OpenAI Realtime
  - likely best fit if we prioritize tool-call maturity and existing Otto
    provider proxy investment
  - higher cost than xAI for some voice paths based on current public pricing
- Google Gemini Live
  - useful comparator for realtime multimodal behavior and cost
  - telephony/meeting integration still likely needs more glue than
    MeetingBaas/Pipecat

For the first PoC, make the provider a configuration choice inside the sidecar.
The implementation should be able to test `meetingbaas_hosted`, `xai_voice`, and
`openai_realtime` without changing meeting-run persistence or OpenClaw
delegation contracts.

### Sidecar Responsibilities

- create or receive the MeetingBaas speaking bot session
- run the Pipecat audio pipeline
- maintain local rolling transcript context
- maintain local meeting state for low-latency decisions
- call the control plane with transcript/state events
- decide when to delegate to OpenClaw
- poll or subscribe for delegation answers
- convert final answer text to speech
- emit speech/audit events back to the control plane

### Static Initialization

The sidecar must accept a structured static initialization block:

```json
{
  "agentName": "Otto Meeting Agent",
  "workspaceName": "Acme",
  "meetingPurpose": "Weekly product sync",
  "voiceStyle": "concise, calm, interrupt only when invited",
  "allowedSpeechModes": ["direct_question", "explicit_invitation"],
  "ottoInstructions": "Use Otto as the main brain for workspace history, tools, and research.",
  "knownContext": [
    "This meeting is internal to the Acme workspace.",
    "Prefer short spoken answers and offer to follow up in the workspace."
  ]
}
```

Render this into the MeetingBaas speaking bot `prompt` and, if using a forked
sidecar, into persona markdown files.

### Local Versus OpenClaw Reasoning

Use the local meeting agent for:

- turn-taking
- "I heard that" acknowledgements
- short clarification questions
- safety/policy decisions
- summarizing the last few turns
- deciding whether a deeper answer is needed

Use Otto/OpenClaw for:

- "what did we discuss in previous meetings?"
- workspace memory search
- integration/tool usage
- codebase, docs, or web research
- business-specific decisions
- anything expected to take more than a few seconds

The sidecar should be allowed to say:

> "I will check with Otto and come back in a moment."

Then it should speak the final OpenClaw answer only if the meeting context still
makes it relevant.

## OpenClaw Delegation Design

Prefer reusing `otto-workspace-chat` rather than creating a new meeting-specific
runtime plugin for the PoC.

The control plane should create a hidden or system-owned workspace-chat
conversation per meeting run:

- stable surface key: `meeting:<meetingAgentRunId>`
- title: meeting title or meeting URL hostname
- visibility: workspace-visible after PoC if acceptable, hidden if not
- messages:
  - user/system message from meeting sidecar with the current question
  - attachment/context part containing recent transcript/state
  - assistant answer streamed back through the existing workspace-chat pipeline

The meeting sidecar does not talk directly to the tenant server. It calls
`apps/api`, and `apps/api` reuses the existing worker and runtime plugin path:

```text
meeting sidecar
  -> apps/api delegation route
  -> workspace-chat message persisted
  -> run_workspace_chat_turn job
  -> apps/worker posts to tenant runtime
  -> otto-workspace-chat plugin runs OpenClaw
  -> runtime callbacks update assistant message
  -> sidecar reads final answer
  -> sidecar speaks answer
```

If this path proves too slow for live meetings, add a direct tenant-runtime
delegation route later. Do not optimize this before the PoC measures the actual
latency.

## Speaking Policy

The PoC should include explicit rules before any speech is emitted.

Minimum policy inputs:

- current meeting status
- last speaker
- whether the agent was directly addressed
- whether a participant asked for Otto/the bot by name
- whether an OpenClaw answer is still relevant
- configured `allowedSpeechModes`
- cooldown since the bot last spoke

Minimum policy outputs:

- `stay_silent`
- `send_chat_only`
- `speak_short_answer`
- `ask_clarifying_question`
- `delegate_to_otto`

For the PoC, default to conservative speech:

- speak only when directly addressed or explicitly invited
- never interrupt active speech
- after delegating to OpenClaw, speak only if the answer arrives within a short
  relevance window or the meeting asks again
- if the answer is long, summarize verbally and offer to send details to the
  workspace

## Live Meeting Description

The live description is not just a transcript. It is a rolling state model.

Update it from transcript and chat events:

- every 10-20 seconds while the meeting is active
- immediately when a direct question to the agent appears
- immediately when the topic changes materially
- on bot join/leave/failure

Fields:

- current topic
- recent speaker turns
- explicit questions
- unresolved questions
- decisions
- action items
- risks/blockers
- screen or slide observations if available
- last Otto/OpenClaw delegation state

In the UI, show this as the primary live view. The raw transcript can sit below
it.

## Slide And Screen Handling

PoC handling should be pragmatic:

1. For Google Meet and Microsoft Teams, use MeetingBaas screenshots if they are
   available and cheap enough to poll or retrieve.
2. For Zoom, do not block the PoC on slide understanding because MeetingBaas docs
   say screenshots are not available for Zoom through the screenshots endpoint.
3. Post-meeting, use the video artifact for offline slide/frame extraction if
   needed.

Live slide understanding is optional for the first PoC acceptance criteria.
Meeting voice and OpenClaw delegation are more important.

## Worker Jobs

Add job types:

- `meeting_agent_start`
  - optional if start cannot complete safely inside the API route
  - creates the MeetingBaas bot and records `meeting_baas_bot_id`

- `meeting_agent_poll_status`
  - reconciliation path for status if webhook delivery is missed

- `meeting_agent_ingest_artifacts`
  - downloads artifacts from presigned URLs
  - normalizes transcript, diarization, chat, and participants
  - stores artifacts in Otto-owned storage

- `meeting_agent_stop`
  - asks MeetingBaas or sidecar to remove the bot

- `meeting_agent_timeout`
  - marks stale runs failed if no status or sidecar heartbeat arrives

Keep webhooks idempotent. Use `external_event_id` and `(run_id, event_type,
external_event_id)` style uniqueness when possible.

## UI Shape

Add a small workspace feature under the new SPA.

Routes can be:

- `/:orgSlug/meetings`
- `/:orgSlug/meetings/:runId`

PoC page pieces:

- start form:
  - meeting URL
  - bot name
  - meeting purpose
  - speech mode
  - optional static context
- live run view:
  - status rail
  - current live description
  - recent transcript turns
  - delegation panel
  - recent spoken answers
  - stop bot action
- completed run view:
  - transcript
  - participants
  - artifacts
  - delegation trace
  - errors and webhook timeline

Use workspace copy such as "meeting agent" and "Otto" in user-facing UI. Avoid
`control plane`, `tenant runtime`, and `OpenClaw` in user-facing copy unless
rendering operator diagnostics.

## Environment And Secrets

Add only when code paths use them:

- `MEETINGBAAS_API_KEY`
- `MEETINGBAAS_WEBHOOK_SECRET`
- `MEETING_AGENT_SIDECAR_BASE_URL`
- `MEETING_AGENT_SIDECAR_TOKEN`
- `XAI_API_KEY`
- optional provider keys used by the sidecar, depending on the selected Pipecat
  STT/TTS/LLM services

For the PoC, prefer hosted MeetingBaas and the speaking bot API first. Do not add
self-hosting Kubernetes, SQS, or S3 infrastructure unless hosted APIs cannot
support the required speech loop.

## Increment Plan

### Increment 1: Manual MeetingBaas Bot Launch

Goal: prove Otto can create and track a meeting bot.

Tasks:

- add MeetingBaas client wrapper in the meeting-agent domain
- add run table and event table migrations
- add workspace API route to start a run
- call MeetingBaas `POST /v2/bots` or speaking bot `POST /bots`
- persist `meeting_baas_bot_id`
- configure bot name, entry message, and `extra` metadata with Otto run id
- add run detail route with raw status
- add basic workspace UI start form

Acceptance:

- a user can paste a Meet/Zoom/Teams URL
- MeetingBaas returns a bot id
- the workspace shows queued/joining/in-call status
- bot identity and entry message are controlled by Otto

### Increment 2: Webhooks And Post-Meeting Artifacts

Goal: make runs durable and inspectable after completion.

Tasks:

- add SVIX webhook verification route
- add callback route with `x-mb-secret` verification for per-bot fallback
- ingest `bot.status_change`, `bot.completed`, `bot.failed`, and
  `bot.chat_message`
- enqueue artifact ingest on completion
- download transcript, diarization, audio, chat messages, and participants
- normalize transcript segments
- render completed transcript and artifact metadata in the workspace

Acceptance:

- missed browser refreshes do not lose run state
- completed meetings show transcript and participant data
- artifact URLs are downloaded before expiry
- duplicate webhooks are harmless

### Increment 3: Speaking Sidecar PoC

Goal: prove a bot can speak with static context.

Tasks:

- add or deploy a MeetingBaas speaking-bot sidecar
- pass static initialization as `prompt`, `personas`, `bot_name`,
  `entry_message`, and `extra`
- add sidecar callback auth
- accept sidecar events for transcript/state/speech
- persist sidecar events and live state snapshots
- expose live state in run detail UI

Acceptance:

- the bot joins and can speak a short configured response
- the workspace receives live transcript or meeting-state events from the
  sidecar
- static name, context, and speaking style affect the bot behavior
- run detail shows the live description while the meeting is running

### Increment 4: OpenClaw Delegation

Goal: make Otto/OpenClaw the slower main brain.

Tasks:

- add `meeting_agent_delegations`
- add sidecar delegation API
- create or reuse a hidden workspace-chat conversation per meeting run
- send recent meeting context to `otto-workspace-chat`
- track assistant placeholder id and runtime session key
- expose delegation status and final answer to sidecar
- sidecar speaks the final answer when policy allows

Acceptance:

- a live meeting question can trigger an Otto/OpenClaw run
- OpenClaw receives recent meeting context and the user question
- OpenClaw can use existing managed tools and instructions
- the answer returns to the meeting sidecar
- the sidecar speaks a concise answer in the meeting
- the workspace shows the delegation trace

### Increment 5: Safety, Failure, And Operator Diagnostics

Goal: make the PoC demoable without hidden footguns.

Tasks:

- add speech cooldowns and direct-address detection
- add stale delegation handling
- add stop/leave action
- add run timeout behavior
- add failure states for bot not accepted, meeting not started, transcription
  error, and sidecar unavailable
- add simple admin diagnostics for raw webhook and sidecar events

Acceptance:

- bot can be stopped from the workspace
- bot does not repeatedly speak on stale answers
- waiting-room and not-accepted failures are visible
- sidecar failures do not corrupt run state

## Testing

Unit tests:

- MeetingBaas request builder
- webhook signature verification adapter
- webhook payload normalization
- event idempotency
- transcript artifact normalization
- static initialization renderer
- voice provider selection and configuration
- speaking policy decision function
- OpenClaw delegation request builder

Integration tests:

- workspace start route creates a run and calls mocked MeetingBaas
- webhook route updates status and enqueues artifact ingest
- sidecar event route updates live state snapshots
- delegation route creates workspace-chat messages and tracks assistant ids

Manual tests:

- Google Meet bot joins and speaks
- Zoom bot joins and records
- Teams bot joins if test tenant is available
- bot-not-accepted failure is handled
- completed artifacts are downloaded before URL expiry
- OpenClaw delegation answer is spoken only when still relevant

## Risks

- MeetingBaas hosted speaking bot API may not expose enough hooks for custom
  Otto delegation. Mitigation: fork the open-source speaking bot service and
  deploy an Otto-owned sidecar.
- Live transcript events may not be available in the exact shape needed from the
  hosted API. Mitigation: sidecar emits its own transcript/state events from the
  Pipecat pipeline.
- OpenClaw delegation may be too slow for natural spoken turn-taking.
  Mitigation: the meeting agent gives an immediate acknowledgement, then speaks
  only concise final answers if still relevant.
- Meeting participants may not accept the bot into the meeting. Mitigation:
  clear status and retry UX, plus entry message and recognizable bot identity.
- Zoom screenshot support is limited through MeetingBaas. Mitigation: make live
  slide understanding optional in the PoC and use post-meeting video analysis
  later.
- Hosted MeetingBaas retention and presigned URL expiry can lose artifacts.
  Mitigation: worker downloads artifacts immediately on completion.
- Voice behavior can be socially disruptive. Mitigation: conservative speech
  policy and explicit cooldowns from day one.

## Acceptance Criteria

- A workspace user can start a meeting agent for a pasted Google Meet, Zoom, or
  Teams URL.
- The bot joins with an Otto-controlled name and entry message.
- The bot has static initialization context for name, meeting purpose, workspace
  context, and speech policy.
- The workspace shows live run status and a live meeting description.
- The bot can speak in the meeting.
- The sidecar can ask Otto/OpenClaw a deeper question with recent meeting
  context.
- Otto/OpenClaw can return an answer through the existing tenant runtime path.
- The meeting agent can speak that answer back into the meeting.
- Completed meetings retain transcript, participants, artifacts, and delegation
  trace in Otto-owned storage.
- Failures are visible and do not require direct database inspection.

## Status Checklist

- [ ] create MeetingBaas client wrapper
- [ ] add meeting-agent run/event schema
- [ ] add manual workspace start API
- [ ] add basic workspace start UI
- [ ] ingest MeetingBaas webhooks/callbacks
- [ ] download and normalize completed artifacts
- [ ] deploy or fork speaking bot sidecar
- [ ] add sidecar event callback API
- [ ] store live meeting description snapshots
- [ ] add OpenClaw delegation API
- [ ] connect delegation to `otto-workspace-chat`
- [ ] speak returned OpenClaw answer in the meeting
- [ ] add stop/leave action
- [ ] add failure diagnostics and timeout handling

## Open Questions

- Should the first sidecar use MeetingBaas' hosted speaking bot API or an
  Otto-owned fork from the start?
- Which STT/TTS/realtime voice provider should the PoC use inside Pipecat:
  MeetingBaas hosted defaults, xAI Voice, OpenAI Realtime, Google Gemini Live,
  or provider-specific STT/TTS components?
- Should meeting-agent conversations be visible in the normal workspace chat
  sidebar or hidden behind meeting-run detail pages?
- What is the default speech mode: direct-address only, host-approved proactive,
  or silent-until-mentioned?
- What consent copy should the bot use in the entry message?
- Do we need a separate meeting-agent service in this monorepo, or should the
  sidecar live in a separate deployment repo until the PoC proves value?
- Should MeetingBaas account-level webhooks be mandatory for the PoC, or are
  per-bot callbacks enough for the first demo?
- What storage backend should hold downloaded artifacts in local development and
  production?
