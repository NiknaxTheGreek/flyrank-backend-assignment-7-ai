# FlyRank Decision Flow

An independent React decision-flow assignment project for authoring binary AI routing graphs, running graph-driven decisions, and inspecting exactly how every run reached an explicit terminal outcome.

## What it delivers

- **React Flow editor** — add/select/edit decision nodes, connect only explicit `YES` and `NO` handles, and add terminal outcomes.
- **Graph-driven runtime** — execution starts from any selected node, resolves each node dynamically, validates an exact `YES`/`NO` response, follows the matching edge, and stops at an explicit terminal node.
- **Inngest function** — every decision evaluation in the registered `execute-decision-graph` function is wrapped in a meaningful, dynamically named Inngest step.
- **Safe AI mode** — uses Replit AI Integrations through an OpenAI-compatible SDK, treats all prompt/context/input text as untrusted data, and validates model output again before routing.
- **Deterministic stub mode** — test-friendly execution without an external call.
- **Visible resilience** — graph validation, execution highlights, animated traversed edges, an execution trace, failure messages, and retry-ready execution controls.
- **Persistence and portability** — JSON import/export plus browser-local save/load.

## Running the app

The workspace provides managed workflows for the web app and API. For local Inngest verification, start the `Inngest Dev Server` workflow after the API is running.

Useful checks:

```bash
pnpm --filter @workspace/api-server run test
pnpm run typecheck
PORT=23305 BASE_PATH=/ pnpm --filter @workspace/flyrank-decision-flow run build
pnpm --filter @workspace/api-server run build
```

## Environment and secret handling

- `.env.example` documents the required managed-AI names without values.
- Real `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` are runtime secrets provided by Replit AI Integrations; they are never exposed to the browser, code, logs, or evidence.
- `INNGEST_DEV=1` is a non-secret development setting used only to connect the local Inngest dev server.
- `.env` and `.env.*` are ignored, while `.env.example` remains tracked.

## Verification package

See [`evidence/README.md`](evidence/README.md) for the exact runtime, test, build, model, screenshot, and repository-state artifacts. See [`docs/requirements-audit.md`](docs/requirements-audit.md) for a requirement-by-requirement audit and preserved-brief limitations.