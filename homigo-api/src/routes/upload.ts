import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { uploadImage } from "../utils/cloudinary";
import { z } from "zod";

const router = Router();

router.post("/image", requireAuth, async (req, res) => {
  const schema = z.object({ base64: z.string() });
  const p = schema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: "Invalid data" });
  const url = await uploadImage(p.data.base64);
  return res.json({ url });
});

export default router;
