import { Router, type IRouter } from "express";
import healthRouter from "./health";
import goalPlanRouter from "./goal-plan";
import insightExplanationRouter from "./insight-explanation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(goalPlanRouter);
router.use(insightExplanationRouter);

export default router;
