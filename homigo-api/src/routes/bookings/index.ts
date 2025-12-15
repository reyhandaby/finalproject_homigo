import { Router } from "express";
import createRouter from "./create";
import listRouter from "./list";
import paymentRouter from "./payment";
import actionsRouter from "./actions";

const router = Router();

router.use("/", createRouter);
router.use("/", listRouter);
router.use("/", paymentRouter);
router.use("/", actionsRouter);

export default router;
