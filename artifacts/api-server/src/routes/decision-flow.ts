import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  ExecuteDecisionGraphBody,
  ExecuteDecisionGraphResponse,
  GetDecisionFlowCapabilitiesResponse,
  ValidateDecisionGraphBody,
  ValidateDecisionGraphResponse,
} from "@workspace/api-zod";
import {
  validateGraph,
  type DecisionGraphInput,
  type ExecutionResult,
} from "../lib/decision-flow-engine";
import {
  getStoredExecution,
  queueExecution,
  waitForExecutionResult,
} from "../lib/decision-flow-execution-store";
import { inngest } from "../lib/decision-flow-inngest";

const router: IRouter = Router();
const DEFAULT_WAIT_TIMEOUT_MS = 60_000;

function failedValidationResult(
  executionId: string,
  startNodeId: string,
  errors: string[],
): ExecutionResult {
  return {
    status: "failed",
    executionId,
    visitedNodeIds: [],
    logs: errors.map((message, index) => ({
      sequence: index + 1,
      nodeId: startNodeId,
      label: "Graph validation",
      status: "error",
      message,
    })),
    error: errors.join(" "),
  };
}

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

router.get("/decision-flow/executions/:executionId", (req, res): void => {
  const stored = getStoredExecution(req.params.executionId);
  if (!stored) {
    res.status(404).json({ error: "Execution not found." });
    return;
  }
  res.json(stored);
});

router.post("/decision-flow/execute", async (req, res): Promise<void> => {
  const parsed = ExecuteDecisionGraphBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid graph execution request");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const executionId = randomUUID();
  const request = {
    ...parsed.data,
    graph: parsed.data.graph as DecisionGraphInput,
    executionId,
  };

  // Invalid graphs fail before dispatch. Valid graph traversal itself is owned by
  // the Inngest function so there is exactly one execution authority.
  const validation = validateGraph(request.graph);
  if (!validation.valid) {
    const result = failedValidationResult(
      executionId,
      request.startNodeId,
      validation.errors,
    );
    req.log.warn({ executionId, errors: validation.errors }, "Graph validation failed");
    res.status(400).json(ExecuteDecisionGraphResponse.parse(result));
    return;
  }

  queueExecution(executionId);

  try {
    await inngest.send({
      name: "flyrank/decision-flow.execute",
      data: request,
    });
  } catch (error) {
    req.log.error({ executionId, error }, "Inngest event dispatch failed");
    res.status(503).json({
      error: "Workflow execution could not be dispatched to Inngest.",
      executionId,
    });
    return;
  }

  req.log.info({ executionId }, "Graph execution dispatched to Inngest");

  const configuredTimeout = Number(process.env.DECISION_FLOW_WAIT_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(configuredTimeout)
    ? Math.max(1_000, Math.min(configuredTimeout, 120_000))
    : DEFAULT_WAIT_TIMEOUT_MS;
  const result = await waitForExecutionResult(executionId, timeoutMs);

  if (!result) {
    req.log.warn({ executionId, timeoutMs }, "Timed out waiting for Inngest execution result");
    res.status(504).json({
      error: "Workflow is still running. Query the execution status endpoint.",
      executionId,
    });
    return;
  }

  if (result.status === "failed") {
    req.log.warn({ executionId, error: result.error }, "Inngest graph execution failed");
    res.status(400).json(ExecuteDecisionGraphResponse.parse(result));
    return;
  }

  req.log.info(
    { executionId, nodeCount: result.visitedNodeIds.length },
    "Inngest graph execution completed",
  );
  res.json(ExecuteDecisionGraphResponse.parse(result));
});

export default router;