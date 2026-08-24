import type { ExecutionResult } from "./decision-flow-engine";

export type ExecutionState = "queued" | "running" | "completed" | "failed";

export interface StoredExecution {
  executionId: string;
  state: ExecutionState;
  result?: ExecutionResult;
  updatedAt: number;
}

const executions = new Map<string, StoredExecution>();

export function queueExecution(executionId: string): void {
  executions.set(executionId, {
    executionId,
    state: "queued",
    updatedAt: Date.now(),
  });
}

export function markExecutionRunning(executionId: string): void {
  const existing = executions.get(executionId);
  executions.set(executionId, {
    executionId,
    state: "running",
    result: existing?.result,
    updatedAt: Date.now(),
  });
}

export function storeExecutionResult(result: ExecutionResult): void {
  executions.set(result.executionId, {
    executionId: result.executionId,
    state: result.status === "completed" ? "completed" : "failed",
    result,
    updatedAt: Date.now(),
  });
}

export function getStoredExecution(executionId: string): StoredExecution | undefined {
  return executions.get(executionId);
}

export async function waitForExecutionResult(
  executionId: string,
  timeoutMs = 30_000,
  pollMs = 25,
): Promise<ExecutionResult | undefined> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const stored = executions.get(executionId);
    if (stored?.result) return stored.result;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  return undefined;
}

export function clearExecutionStore(): void {
  executions.clear();
}
