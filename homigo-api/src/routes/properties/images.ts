import { Router } from "express";
import { prisma } from "../../app";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middlewares/auth";

const router = Router();

router.post(
  "/:id/images",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const schema = z.object({ base64: z.string() });
      const p = schema.safeParse(req.body);
      if (!p.success) {
        return res.status(400).json({ message: "Invalid data" });
      }

      const { uploadImage } = await import("../../utils/cloudinary");
      const url = await uploadImage(p.data.base64);
      const img = await prisma.propertyImage.create({
        data: { propertyId: id, url },
      });

      return res.json(img);
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      next(error);
    }
  }
);

router.delete(
  "/images/:imageId",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const imageId = req.params.imageId;
      await prisma.propertyImage.delete({ where: { id: imageId } });
      return res.json({ message: "Image deleted" });
    } catch (error) {
      console.error("❌ Error deleting image:", error);
      next(error);
    }
  }
);

export default router;
