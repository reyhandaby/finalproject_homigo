import { Router } from "express";
import { prisma } from "../../app";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth";
import multer from "multer";
import { uploadPaymentProofBuffer } from "../../utils/cloudinary";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      const err: any = new Error("INVALID_MIMETYPE");
      return cb(err);
    }
    cb(null, true);
  },
});

const getAuthUser = (req: any): { id: string } => {
  return (req as any).user;
};

router.post(
  "/:id/payment-proof",
  requireAuth,
  upload.single("paymentProof"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = getAuthUser(req);
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file) {
        return res.status(400).json({
          message: "Payment proof image file is required",
        });
      }

      const booking = await prisma.booking.findUnique({ where: { id } });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.userId !== user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (booking.paymentStatus !== "PENDING") {
        return res.status(400).json({
          message:
            "Payment proof already uploaded or booking already processed",
        });
      }

      const { secure_url } = await uploadPaymentProofBuffer(id, file.buffer);

      await prisma.paymentProof.upsert({
        where: { bookingId: id },
        update: { imageUrl: secure_url },
        create: { bookingId: id, imageUrl: secure_url },
      });

      await prisma.booking.update({
        where: { id },
        data: { paymentStatus: "WAITING_CONFIRMATION" },
      });

      console.log(`✅ Payment proof uploaded for booking ${id}`);
      return res.json({
        message: "Payment proof uploaded successfully",
        imageUrl: secure_url,
      });
    } catch (error: any) {
      if (error?.message === "INVALID_MIMETYPE") {
        return res
          .status(400)
          .json({ message: "File must be jpg, png, or webp" });
      }
      if (error?.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File size must be less than 2MB" });
      }
      console.error("❌ Error uploading payment proof:", error);
      next(error);
    }
  }
);

export default router;
