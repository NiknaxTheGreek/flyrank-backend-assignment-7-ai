import { describe, expect, it } from 'vitest';
import {
  appendExecutionRun,
  nextAttemptForRetry,
  type ExecutionRun,
} from '../../flyrank-decision-flow/src/lib/execution-history';

const failedRun: ExecutionRun = {
  id: 'run-1',
  status: 'failed',
  logs: [{ sequence: 1, nodeId: 'start', label: 'Start', status: 'error', message: 'Missing YES branch.' }],
  visitedNodeIds: ['start'],
  error: 'Missing YES branch.',
  startNodeId: 'start',
  input: 'example',
  mode: 'stub',
  startedAt: '2026-08-22T00:00:00.000Z',
  finishedAt: '2026-08-22T00:00:01.000Z',
  attempt: 1,
};

describe('execution history helpers', () => {
  it('retains completed and failed runs in chronological history', () => {
    const completedRun: ExecutionRun = {
      ...failedRun,
      id: 'run-2',
      status: 'completed',
      error: undefined,
      terminalOutcome: 'APPROVED',
      attempt: 1,
    };

    const history = appendExecutionRun(appendExecutionRun([], failedRun), completedRun);

    expect(history).toHaveLength(2);
    expect(history.map(run => run.id)).toEqual(['run-1', 'run-2']);
    expect(history[0].error).toBe('Missing YES branch.');
    expect(history[1].terminalOutcome).toBe('APPROVED');
  });

  it('increments a retry attempt from the failed run it replays', () => {
    expect(nextAttemptForRetry(failedRun)).toBe(2);
    expect(nextAttemptForRetry()).toBe(1);
  });
});