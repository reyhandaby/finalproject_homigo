import { Router } from "express";
import listRouter from "./list";
import manageRouter from "./manage";
import imagesRouter from "./images";

const router = Router();

router.use("/", listRouter);
router.use("/", manageRouter);
router.use("/", imagesRouter);

export default router;
