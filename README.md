# FlyRank Backend Assignment 7 — AI Decision Flow

A React Flow + Inngest workflow editor for authoring binary AI routing graphs and executing each decision as an Inngest step.

## S3 architecture

```text
React Flow graph
    ↓
POST /api/decision-flow/execute
    ↓
validate graph + assign execution ID
    ↓
Inngest event: flyrank/decision-flow.execute
    ↓
execute-decision-graph function
    ↓
step.run(decision node 1) → exact YES/NO → matching edge
    ↓
step.run(decision node 2) → exact YES/NO → matching edge
    ↓
terminal outcome
    ↓
result returned to the UI
```

**Inngest is the execution authority.** The HTTP route does not execute the graph first and then send a duplicate event. Valid graphs are dispatched before traversal, and the registered Inngest function owns `runDecisionGraph`. This prevents the earlier architecture from potentially calling the model twice for one UI execution.

The small in-process execution store is only the result handoff for this assignment's single-process development setup; it is not a production distributed queue or database. A timeout also exposes `GET /api/decision-flow/executions/:executionId` so the current state/result remains inspectable in the running API process.

## What it delivers

- **React Flow editor** — add/select/edit decision nodes, connect explicit `YES` and `NO` handles, and add terminal outcomes.
- **Editable prompts** — each decision node contains editable prompt/context data.
- **Graph-driven runtime** — starts at the selected node, validates exact `YES`/`NO`, follows the matching graph edge, and tracks execution order.
- **Inngest execution** — `execute-decision-graph` is triggered by `flyrank/decision-flow.execute`; every traversed decision evaluation is wrapped in a dynamically named `step.run()`.
- **Safe AI mode** — uses an OpenAI-compatible SDK server-side, treats graph prompt/context/input as untrusted data, and accepts only exact `YES` or `NO` for routing.
- **Deterministic stub mode** — credential-free reproducible execution used by tests and CI.
- **Local graph state** — Save/Load plus JSON Import/Export.
- **Polish features** — visual execution state, animated active/traversed edges, error handling, retry failed runs, execution history, and improved editor styling.
- **Graph safety** — duplicate IDs, missing endpoints, duplicate branch edges, cycles, missing nodes/branches, invalid model output, and a 48-step ceiling are handled visibly.

## Install and verify

This is a pnpm workspace. From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run test
pnpm run typecheck
PORT=23305 BASE_PATH=/ pnpm --filter @workspace/flyrank-decision-flow run build
pnpm --filter @workspace/api-server run build
```

## Local Inngest development

Build/start the API with dev mode enabled, then point the Inngest Dev Server at its serve endpoint:

```bash
pnpm --filter @workspace/api-server run build
PORT=3000 INNGEST_DEV=1 pnpm --filter @workspace/api-server run start

npx --ignore-scripts=false inngest-cli@latest dev \
  --no-discovery \
  -u http://127.0.0.1:3000/api/inngest
```

The registration endpoint should report one function. The current CI gate performs this with a real local Inngest Dev Server and then submits a stub-mode graph through the public execution API.

## Current verification — 2026-08-24

GitHub Actions run **32710991333** executed the current repaired code and passed:

- **14 Vitest tests** across 3 files;
- full workspace typecheck;
- React/Vite production build;
- API server build;
- real Inngest Dev Server registration with `function_count: 1`, `mode: dev`;
- real HTTP graph submission through `/api/decision-flow/execute`;
- Inngest function `execute-decision-graph` observed by the dev server;
- returned traversal `start → yes` with terminal outcome `APPROVED`;
- explicit CI markers `INNGEST_EXECUTION_GATE=PASS` and `INNGEST_FUNCTION_OBSERVED=PASS`.

The runtime gate uses deterministic stub mode so it proves orchestration without consuming paid model calls. Earlier evidence separately records a genuine managed OpenAI-compatible `YES` decision checkpoint.

## Environment and secret handling

- `.env.example` documents configuration names without real credentials.
- `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` are server-side runtime secrets and are not exposed to the browser.
- `DECISION_FLOW_MODEL` selects the model; current code defaults to `gpt-5.6-luna` when AI mode is selected.
- `INNGEST_DEV=1` directs the SDK to the local Inngest Dev Server.
- `.env` and `.env.*` are ignored while `.env.example` remains tracked.

## Evidence

See [`evidence/README.md`](evidence/README.md) for the existing screenshots/model/runtime evidence and [`docs/requirements-audit.md`](docs/requirements-audit.md) for the recovered-S3 mapping. The CI workflow also uploads current Inngest API/dev-server logs and the exact runtime execution JSON as the `assignment-7-inngest-runtime-evidence` artifact.

## AI Rematch boundary

This is the independent AI-generated implementation. The S4 human-vs-AI comparison remains a separate project-required stage after the human-created Assignment 7 version exists; it is not claimed complete here.
