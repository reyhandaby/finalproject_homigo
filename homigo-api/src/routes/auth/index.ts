import { Router } from "express";
import registerRouter from "./register";
import loginRouter from "./login";
import verifyRouter from "./verify";
import passwordRouter from "./password";
import googleRouter from "./google";

const router = Router();

router.use("/", registerRouter);
router.use("/", loginRouter);
router.use("/", verifyRouter);
router.use("/", passwordRouter);
router.use("/google", googleRouter);

export default router;
