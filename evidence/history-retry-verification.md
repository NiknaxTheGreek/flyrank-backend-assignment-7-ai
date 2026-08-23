# Persistent execution history and retry verification

The execution store now appends each completed or failed run to browser-local history under `flyrank-decision-execution-history`. Each record retains:

- the run trace and visited nodes;
- completed/failed status, terminal outcome, and error detail;
- captured start-node, input, and mode settings;
- start/finish times, attempt number, and retry lineage.

A new execution clears only the active canvas trace and edge animation; it does not remove earlier history. The Execution History panel renders the current trace plus expandable prior runs.

When a run fails, the execution setup shows an explicit **Retry as attempt N** action. It replays the failed run’s captured settings, clears pending retry state at start, and creates the next numbered history record. Error details remain visible in the current and prior history entries.

Focused coverage was added in `artifacts/api-server/tests/execution-history.test.ts`. The full test suite passed with **2 files / 11 tests**.