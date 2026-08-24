# Requirements audit

## Preserved project requirements

| Requirement | Implementation and evidence | Status |
| --- | --- | --- |
| Independent AI assignment project | Built as a new `FlyRank Decision Flow` web artifact; no separate human implementation was inspected | PASS |
| React application, React Flow, Shadcn-style components | React Flow canvas and custom nodes are in the web artifact; the existing Shadcn-style component set is used throughout | PASS |
| Add/connect/edit binary decision nodes | The canvas adds nodes, exposes distinct YES/NO handles, prevents duplicate branch handles, and opens a node editor for label, prompt, context, and terminal outcome | PASS |
| Local persistence | Browser-local Save/Load plus JSON Import/Export controls are present in the editor | PASS |
| Dynamic graph-driven execution | `runDecisionGraph` builds node/edge maps from the supplied graph, starts at `startNodeId`, dynamically resolves each node, and routes by matching edges—no graph path is hard-coded | PASS |
| Meaningful Inngest steps | `execute-decision-graph` adapts the graph runner to `step.run()` using names like `decision-1-safe-request`; local Inngest registration/run evidence is recorded | PASS |
| Managed OpenAI-compatible provider | AI mode creates the OpenAI SDK client only server-side from managed Replit AI Integration environment values | PASS |
| Strict YES/NO validation | The routing guard accepts only trimmed case-insensitive exact `YES` or `NO`; every other output fails with `INVALID_MODEL_OUTPUT` | PASS |
| Explicit terminal outcomes | Nodes with `terminalOutcome` end execution visibly with that outcome | PASS |
| Invalid output, missing node/branch, cycles | Predictable `INVALID_MODEL_OUTPUT`, `MISSING_NODE`, `MISSING_BRANCH`, and cycle validation/runtime outcomes are sent to the UI trace and tested | PASS |
| Deterministic stub mode | Stub routing is deterministic and is the default execution mode | PASS |
| Tests | Eleven focused Vitest tests cover YES, NO, ambiguous text, adversarial-style output, graph mutation, cycle detection, missing branch, missing node, strict validation, multi-run history retention, and retry-attempt numbering | PASS |
| Execution history and retry | Every finished run is retained in browser-local history with trace, outcome/error, request settings, and attempt metadata. A failed run exposes a Retry action that replays its captured settings as the next numbered attempt while leaving prior error details inspectable | PASS |
| Stage 4 polish | Visual active-node states, animated traversed edges, persistent execution history, JSON import/export, local save/load, validation/error surfacing, and explicit retry controls are implemented | PASS |
| Actual Inngest checkpoint | Preserved evidence records function registration, event receipt, function initialization and `inngest/function.finished` | PASS |
| Genuine managed LLM checkpoint | Preserved evidence records a managed OpenAI-compatible strict `YES` result with provider/model/status/latency/token usage | PASS |
| Current reproducibility gate | GitHub Actions run `32703190897`: locked install PASS, **11 Vitest tests PASS**, workspace typecheck PASS, React/Vite build PASS, API build PASS | PASS |
| Documentation and evidence | README, this audit, source-gap note, env notes, screenshots, runtime result files, and current CI evidence are stored in the repository | PASS |

## Preserved-brief/source gaps

- The original complete Assignment 7 S3 text is still unavailable in the currently retrievable source set. This audit therefore certifies only the requirements preserved in the repository brief; it does **not** claim compliance with unpreserved acceptance criteria.
- The artifact selection required the React/Vite web template. The delivered app is React-based and does not depend on Next.js-only features.
- A human Assignment 7 implementation was not available and was not inspected. S4 human-vs-AI comparison remains pending.

## Completion boundary

The current implementation is technically reproducible and passes every checkpoint in the preserved brief. **Exact Assignment 7 S3 certification remains blocked solely by the missing authoritative source text.** Recovering that source is required before this project can honestly label the whole Assignment 7 submission fully S3-complete.
