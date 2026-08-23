import type {
  ExecutionLogEntry,
  ExecutionResultStatus,
} from '@workspace/api-client-react';

export const EXECUTION_HISTORY_STORAGE_KEY = 'flyrank-decision-execution-history';
export const MAX_EXECUTION_HISTORY = 25;

export interface ExecutionRequestSnapshot {
  startNodeId: string;
  input: string;
  mode: 'stub' | 'ai';
}

export interface ExecutionRun extends ExecutionRequestSnapshot {
  id: string;
  executionId?: string;
  status: ExecutionResultStatus;
  logs: ExecutionLogEntry[];
  visitedNodeIds: string[];
  error?: string;
  terminalNodeId?: string;
  terminalOutcome?: string;
  startedAt: string;
  finishedAt: string;
  attempt: number;
  retryOf?: string;
}

export function nextAttemptForRetry(previousRun?: ExecutionRun): number {
  return previousRun ? previousRun.attempt + 1 : 1;
}

export function appendExecutionRun(
  history: ExecutionRun[],
  run: ExecutionRun,
  maximum = MAX_EXECUTION_HISTORY,
): ExecutionRun[] {
  return [...history, run].slice(-maximum);
}

export function isExecutionRun(value: unknown): value is ExecutionRun {
  if (!value || typeof value !== 'object') return false;
  const run = value as Partial<ExecutionRun>;
  return (
    typeof run.id === 'string' &&
    (run.status === 'completed' || run.status === 'failed') &&
    Array.isArray(run.logs) &&
    Array.isArray(run.visitedNodeIds) &&
    typeof run.startNodeId === 'string' &&
    typeof run.input === 'string' &&
    (run.mode === 'stub' || run.mode === 'ai') &&
    typeof run.attempt === 'number'
  );
}