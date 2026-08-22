import { Router, type IRouter } from "express";
import healthRouter from "./health";
import decisionFlowRouter from "./decision-flow";

const router: IRouter = Router();

router.use(healthRouter);
router.use(decisionFlowRouter);

export default router;
