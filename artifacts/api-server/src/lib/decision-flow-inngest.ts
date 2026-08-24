import { Inngest } from "inngest";
import {
  runDecisionGraph,
  type ExecutionRequest,
  type StepRunner,
} from "./decision-flow-engine";
import {
  markExecutionRunning,
  storeExecutionResult,
} from "./decision-flow-execution-store";

export const inngest = new Inngest({ id: "flyrank-decision-flow" });

export const decisionGraphExecution = inngest.createFunction(
  {
    id: "execute-decision-graph",
    retries: 1,
    triggers: [{ event: "flyrank/decision-flow.execute" }],
  },
  async ({ event, step }) => {
    const request = event.data as ExecutionRequest;
    const executionId = request.executionId;
    if (!executionId) {
      throw new Error("executionId is required for Inngest graph execution");
    }

    markExecutionRunning(executionId);

    const stepRunner: StepRunner = {
      run<T>(name: string, action: () => Promise<T>): Promise<T> {
        // Every decision-node model call is an Inngest step. Inngest can memoize
        // completed step values during function retries rather than rerunning them.
        return step.run(name, action) as unknown as Promise<T>;
      },
    };

    const result = await runDecisionGraph(request, stepRunner);
    storeExecutionResult(result);
    return result;
  },
);