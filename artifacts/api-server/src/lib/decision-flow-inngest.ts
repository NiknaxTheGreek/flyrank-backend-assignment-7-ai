import { Inngest } from "inngest";
import {
  runDecisionGraph,
  type ExecutionRequest,
  type StepRunner,
} from "./decision-flow-engine";

export const inngest = new Inngest({ id: "flyrank-decision-flow" });

export const decisionGraphExecution = inngest.createFunction(
  {
    id: "execute-decision-graph",
    retries: 1,
    triggers: [{ event: "flyrank/decision-flow.execute" }],
  },
  async ({ event, step }) => {
    const stepRunner: StepRunner = {
      run<T>(name: string, action: () => Promise<T>): Promise<T> {
        // Inngest serializes step values; the graph engine only exchanges JSON-safe values.
        return step.run(name, action) as unknown as Promise<T>;
      },
    };
    return runDecisionGraph(event.data as ExecutionRequest, stepRunner);
  },
);