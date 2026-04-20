# Open Meet

Open Meet is a proof-of-concept workspace meeting agent. The target loop is:
a user starts a bot for a meeting URL, the bot joins through MeetingBaas,
maintains a live meeting description, delegates deeper questions to Otto/OpenClaw,
and stores the meeting transcript, state snapshots, speech decisions, and
delegation trace for review.

## Repository Shape

- `apps/api`: Hono control-plane API for workspace routes, MeetingBaas webhooks,
  and sidecar callbacks.
- `apps/worker`: background jobs for start reconciliation, artifact ingest,
  polling, stop, and stale-run timeouts.
- `apps/web`: browser workspace surface for starting and reviewing meeting runs.
- `apps/meeting-agent`: deployable realtime sidecar boundary for meeting speech
  and MeetingBaas/Pipecat provider experiments.
- `packages/features/meeting-agent`: shared contracts, schemas, DTOs, state
  normalizers, and policy types.
- `_specs`: source-of-truth status and implementation plans.

## Commands

```sh
bun install
bun run check
bun run dev:all
```

Individual services can be started with `bun run dev:api`,
`bun run dev:worker`, `bun run dev:web`, and `bun run dev:meeting-agent`.
