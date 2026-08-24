# Assignment 7 Requirements Audit

Authoritative source: recovered S3 — **Assignment 7: Build an AI Decision Flow with React Flow + Inngest**. S3 records that no PDF was supplied and the available FlyRank portal description is the authoritative assignment source.

| S3 requirement | Current implementation / evidence | Status |
| --- | --- | --- |
| React application | `artifacts/flyrank-decision-flow` | PASS |
| React Flow configured | editor canvas and custom decision/terminal nodes | PASS |
| Inngest configured | Express serve endpoint at `/api/inngest`, registered `execute-decision-graph` function | PASS |
| OpenAI-compatible SDK | server-side `openai` client used by AI mode | PASS |
| Shadcn-style UI | supplied component set used throughout editor | PASS |
| Environment configuration | `.env.example`; managed AI values remain server-side | PASS |
| Frontend runs/builds | current React/Vite production build passes | PASS |
| Inngest development server works | current CI run `32710991333` registered `function_count: 1`, `mode: dev` and completed a dispatched execution | PASS |
| Add nodes | editor supports adding graph nodes | PASS |
| Connect nodes | React Flow connections create graph edges | PASS |
| Edit node prompts | node editor exposes prompt/context fields | PASS |
| YES edge | explicit YES handle/branch | PASS |
| NO edge | explicit NO handle/branch | PASS |
| Local graph-state storage | browser-local Save/Load | PASS |
| JSON import/export | implemented as additional polish/portability | PASS |
| Dynamic traversal | `runDecisionGraph` resolves graph maps at runtime and follows matching supplied edges | PASS |
| AI-driven branching | AI resolver sends each decision prompt/context/input to the configured model in AI mode | PASS |
| Model output constrained to YES/NO | system instruction requests one token; `parseBinaryDecision` accepts only trimmed exact YES/NO and rejects everything else | PASS |
| Workflow execution handled with Inngest | valid executions are dispatched first; the Inngest function owns `runDecisionGraph`; HTTP no longer runs the graph inline before event dispatch | PASS |
| Each traversed decision maps to an Inngest step | Inngest supplies a `StepRunner` backed by `step.run`; a two-decision deterministic test records two distinct decision-step names | PASS |
| Matching answer selects matching edge | exact YES/NO is matched against `edge.branch` dynamically | PASS |
| Execution continues through graph | loop continues to the selected target until terminal/failure | PASS |
| Execution order tracked | `visitedNodeIds` + sequenced execution logs | PASS |
| At least three Phase 4 polish features | visual execution state, animated edges, execution history, retry controls, save/load, JSON import/export, validation/error handling and styling | PASS |
| Error handling | invalid output, missing node, missing branch, duplicate IDs/branches, missing endpoints and cycles are surfaced; max 48 steps | PASS |
| Repository + README | public repo with recovered-S3 architecture/run/evidence documentation | PASS |
| Current deterministic tests | run `32710991333`: **14 Vitest tests passed** across 3 files | PASS |
| Current typecheck | full workspace typecheck passed in run `32710991333` | PASS |
| Current frontend build | React/Vite build passed; large-chunk warning is non-failing | PASS |
| Current API build | API build passed | PASS |
| Current real Inngest orchestration checkpoint | registration reported one function; POST execution traversed `start → yes`, returned `APPROVED`; `execute-decision-graph` observed; CI printed both PASS markers | PASS |
| Genuine managed-model checkpoint | preserved prior evidence records a server-side managed OpenAI-compatible strict YES response with provider/model/latency/token usage | PASS |
| AI Rematch comparison | separate S4 stage after human Assignment 7 exists | PENDING HUMAN VERSION |

## Corrected execution authority

The earlier implementation had two execution authorities:

```text
HTTP → runDecisionGraph inline → completed result → send Inngest event → runDecisionGraph again
```

That was inconsistent with recovered S3 because Inngest did not own the user-facing workflow and a live AI graph could call the model twice.

The repaired flow is:

```text
HTTP → validate → queue execution ID → send Inngest event
                                      ↓
                           execute-decision-graph
                                      ↓
                         decision step.run(...)
                                      ↓
                           graph result handoff
                                      ↓
                               HTTP / status
```

The in-process result store is intentionally a small assignment-level handoff mechanism. It is adequate for the required local/dev workflow and current single API process, but a horizontally scaled production service should replace it with durable shared storage.

## Current executed checkpoint

GitHub Actions run `32710991333` on 2026-08-24 ran the current branch after the orchestration repair:

- 14 tests: PASS;
- typecheck: PASS;
- frontend build: PASS;
- API build: PASS;
- Inngest serve endpoint: `function_count=1`, `mode=dev`;
- execution request: PASS;
- execution ID: `4fe24314-02d5-4193-a399-e439f4aa831e`;
- visited nodes: `start`, `yes`;
- terminal outcome: `APPROVED`;
- Inngest function observed: `execute-decision-graph`;
- `INNGEST_EXECUTION_GATE=PASS`;
- `INNGEST_FUNCTION_OBSERVED=PASS`.

The workflow uploads the API log, Inngest dev-server log, registration response and exact execution response as `assignment-7-inngest-runtime-evidence`.

## Completion boundary

The recovered S3 core requirements are satisfied by the current AI-generated implementation and current-code checkpoint. The overall project-level Assignment 7 completion remains separate from the S4 human-vs-AI Rematch, which cannot be completed until the human-created Assignment 7 version exists.
