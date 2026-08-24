import { beforeEach, describe, expect, it } from "vitest";
import {
  clearExecutionStore,
  getStoredExecution,
  markExecutionRunning,
  queueExecution,
  storeExecutionResult,
  waitForExecutionResult,
} from "../src/lib/decision-flow-execution-store";

describe("decision-flow execution store", () => {
  beforeEach(() => clearExecutionStore());

  it("tracks queued, running and completed state for one execution id", async () => {
    queueExecution("exec-1");
    expect(getStoredExecution("exec-1")?.state).toBe("queued");

    markExecutionRunning("exec-1");
    expect(getStoredExecution("exec-1")?.state).toBe("running");

    storeExecutionResult({
      status: "completed",
      executionId: "exec-1",
      terminalNodeId: "done",
      terminalOutcome: "APPROVED",
      visitedNodeIds: ["start", "done"],
      logs: [],
    });

    const result = await waitForExecutionResult("exec-1", 50, 1);
    expect(result?.status).toBe("completed");
    expect(result?.terminalOutcome).toBe("APPROVED");
    expect(getStoredExecution("exec-1")?.state).toBe("completed");
  });

  it("returns undefined when an execution has not completed before timeout", async () => {
    queueExecution("exec-2");
    await expect(waitForExecutionResult("exec-2", 5, 1)).resolves.toBeUndefined();
  });
});
