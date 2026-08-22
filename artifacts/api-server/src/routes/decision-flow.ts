import { Router, type IRouter } from "express";
import {
  ExecuteDecisionGraphBody,
  ExecuteDecisionGraphResponse,
  GetDecisionFlowCapabilitiesResponse,
  ValidateDecisionGraphBody,
  ValidateDecisionGraphResponse,
} from "@workspace/api-zod";
import {
  runDecisionGraph,
  validateGraph,
  type DecisionGraphInput,
} from "../lib/decision-flow-engine";
import { inngest } from "../lib/decision-flow-inngest";

const router: IRouter = Router();

router.get("/decision-flow/capabilities", (_req, res): void => {
  res.json(
    GetDecisionFlowCapabilitiesResponse.parse({
      inngestRegistered: true,
      modes: ["stub", "ai"],
      maxSteps: 48,
    }),
  );
});

router.post("/decision-flow/validate", (req, res): void => {
  const parsed = ValidateDecisionGraphBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid graph validation request");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(ValidateDecisionGraphResponse.parse(validateGraph(parsed.data)));
});

router.post("/decision-flow/execute", async (req, res): Promise<void> => {
  const parsed = ExecuteDecisionGraphBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid graph execution request");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const request = {
    ...parsed.data,
    graph: parsed.data.graph as DecisionGraphInput,
  };
  const result = await runDecisionGraph(request);

  if (result.status === "failed") {
    req.log.warn({ executionId: result.executionId, error: result.error }, "Graph execution failed");
    res.status(400).json(ExecuteDecisionGraphResponse.parse(result));
    return;
  }

  try {
    await inngest.send({
      name: "flyrank/decision-flow.execute",
      data: { ...request, executionId: result.executionId },
    });
    req.log.info(
      { executionId: result.executionId, nodeCount: result.visitedNodeIds.length },
      "Graph execution completed and event dispatched to Inngest",
    );
  } catch (error) {
    req.log.warn(
      { executionId: result.executionId, error },
      "Graph execution completed; Inngest event dispatch unavailable",
    );
  }

  res.json(ExecuteDecisionGraphResponse.parse(result));
});

export default router;