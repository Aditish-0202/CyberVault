import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import devicesRouter from "./devices";
import alertsRouter from "./alerts";
import analyticsRouter from "./analytics";
import logsRouter from "./logs";
import profileRouter from "./profile";
import settingsRouter from "./settings";
import activitiesRouter from "./activities";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(devicesRouter);
router.use(alertsRouter);
router.use(analyticsRouter);
router.use(logsRouter);
router.use(profileRouter);
router.use(settingsRouter);
router.use(activitiesRouter);

export default router;
