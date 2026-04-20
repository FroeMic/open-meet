# Open Meet Agent Guide

## Purpose

Keep implementation aligned with the MeetingBaas meeting-agent PoC, preserve
state across sessions, and maintain a clean extracted app/package layout.

## Start Here Every Session

1. Read `_specs/README.md`.
2. Read `_specs/STATUS.md`.
3. Read `_specs/TODO_36_meeting_agent_poc.md`.
4. Read `_specs/FIRST_INCREMENT_PLAN.md`.
5. Skim related code before changing architecture.

## Naming And Audience

- `meeting agent` is the user-facing product surface.
- `Otto` is the deeper workspace assistant used for reasoning, memory, and
  tools.
- `OpenClaw`, `control plane`, `tenant runtime`, and `sidecar` are
  operator-facing terms. Avoid them in workspace UI copy unless rendering
  diagnostics.
- Prefer user-facing copy such as "Otto is checking that" and "review this in
  your workspace".

## Architecture Guardrails

- Use the extracted layout from Otto as the model:
  - `apps/api` owns Hono HTTP handlers and API adapters.
  - `apps/worker` owns background jobs and reconciliation.
  - `apps/web` owns browser UI and client routing.
  - `apps/meeting-agent` owns the realtime meeting sidecar boundary.
  - `packages/features/meeting-agent` owns shared contracts, schemas,
    normalizers, and policy logic.
- Keep request handlers thin.
- Keep provider-specific behavior behind small interfaces.
- Design webhooks, callbacks, and worker jobs to be idempotent and resumable.
- Use Hono RPC for browser-facing API routes when practical.
- Use plain HTTP for MeetingBaas webhooks, MeetingBaas bot callbacks, and
  signed sidecar callbacks.
- Do not put realtime meeting media behavior in `apps/gateway`; this repo does
  not currently have that service, and Otto's gateway is for integration
  execution rather than bidirectional meeting audio.
- Do not let `lib` become a catch-all. Place behavior in the bounded context
  that owns it.

## Meeting-Agent Boundaries

- `packages/features/meeting-agent`:
  - run, event, transcript, state snapshot, delegation, artifact, and speech
    policy contracts
  - DTO schemas used by API, web, worker, and sidecar packages
  - pure state/policy helpers
- `apps/api/src/meeting-agent`:
  - workspace run routes
  - MeetingBaas webhook/callback routes
  - signed sidecar ingest and delegation routes
- `apps/worker/src/runtime/meeting-agent`:
  - status repair
  - artifact ingest
  - stop and timeout jobs
- `apps/web/src/features/meeting-agent`:
  - start form
  - live meeting run detail
  - completed run review surface
- `apps/meeting-agent`:
  - provider-specific meeting transport and speech loop
  - transcript/state callbacks into `apps/api`
  - delegation polling and speech output

## Implementation Expectations

- Use Bun for package management and task running.
- Keep package-level `format`, `lint`, `test`, and `build` gates green.
- Add tests before behavior changes.
- Add environment variables only when a code path uses them.
- Keep UI copy aligned with the user-facing terminology above.
- Update `_specs/STATUS.md` and `_specs/FIRST_INCREMENT_PLAN.md` when priorities,
  blockers, or architecture decisions change.
- When a spec is completed, rename `TODO_` files to `DONE_` and update
  references.

## First PoC Biases

- Hosted MeetingBaas first.
- Conservative speech policy first.
- Reuse Otto/OpenClaw workspace chat delegation before inventing a new runtime
  channel.
- Poll delegation status before adding SSE or websockets.
- Download MeetingBaas artifacts promptly because provider URLs expire.
