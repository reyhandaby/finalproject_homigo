import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { prisma } from "../app";
import { z } from "zod";
import bcrypt from "bcryptjs";
import multer from "multer";
import { env } from "../config/env";

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

// ==========================================
// GET /users/me - Get current user profile
// ==========================================
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        code: "USER_NOT_FOUND",
        message: "Pengguna tidak ditemukan",
      });
    }

    console.log(`✅ User profile fetched: ${user.email}`);
    return res.json(user);
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    next(error);
  }
});

// ==========================================
// POST /users/me/avatar - Upload user avatar
// ==========================================
router.post(
  "/me/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id as string;
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file) {
        return res.status(400).json({
          code: "NO_FILE",
          message: "File avatar wajib diunggah",
        });
      }

      if (
        !env.CLOUDINARY_CLOUD_NAME ||
        !env.CLOUDINARY_API_KEY ||
        !env.CLOUDINARY_API_SECRET
      ) {
        return res.status(500).json({
          code: "CLOUDINARY_NOT_CONFIGURED",
          message:
            "Layanan avatar belum dikonfigurasi. Harap set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET di environment.",
        });
      }

      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarPublicId: true },
      });

      if (current?.avatarPublicId) {
        const { destroyByPublicId } = await import("../utils/cloudinary");
        await destroyByPublicId(current.avatarPublicId);
      }

      const { uploadAvatarBuffer } = await import("../utils/cloudinary");
      let secure_url: string;
      let public_id: string;
      try {
        const result = await uploadAvatarBuffer(userId, file.buffer);
        secure_url = result.secure_url;
        public_id = result.public_id;
      } catch (e: any) {
        return res.status(500).json({
          code: "AVATAR_UPLOAD_FAILED",
          message:
            e?.message || "Gagal mengunggah avatar ke layanan penyimpanan",
        });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl: secure_url,
          avatarPublicId: public_id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json(updated);
    } catch (error: any) {
      if (error?.message === "INVALID_MIMETYPE") {
        return res.status(400).json({
          code: "INVALID_FILE_TYPE",
          message: "Tipe file harus jpg, png, atau webp",
        });
      }
      if (error?.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          code: "FILE_TOO_LARGE",
          message: "Ukuran file maksimal 2MB",
        });
      }
      return res.status(500).json({
        code: "UNKNOWN_ERROR",
        message: "Terjadi kesalahan saat menyimpan avatar",
      });
    }
  }
);

// ==========================================
// PUT /users/me - Update user profile
// ==========================================
router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    const schema = z.object({
      name: z.string().min(1, "Nama minimal 1 karakter").optional(),
      avatarUrl: z
        .string()
        .url("URL avatar tidak valid")
        .optional()
        .or(z.literal("")),
    });

    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        code: "INVALID_DATA",
        message: "Data tidak valid",
        errors: validation.error.issues,
      });
    }

    // Remove empty avatarUrl
    const updateData = { ...validation.data };
    if (updateData.avatarUrl === "") {
      delete updateData.avatarUrl;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`✅ User profile updated: ${user.email}`);
    return res.json(user);
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    next(error);
  }
});

// ==========================================
// POST /users/me/password - Change password
// ==========================================
router.post("/me/password", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    const schema = z.object({
      oldPassword: z.string().min(8, "Password minimal 8 karakter"),
      newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    });

    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        code: "INVALID_DATA",
        message: "Data tidak valid",
        errors: validation.error.issues,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        code: "USER_NOT_FOUND",
        message: "Pengguna tidak ditemukan",
      });
    }

    // Verify old password
    if (user.passwordHash) {
      const isValidPassword = await bcrypt.compare(
        validation.data.oldPassword,
        user.passwordHash
      );

      if (!isValidPassword) {
        return res.status(401).json({
          code: "INVALID_OLD_PASSWORD",
          message: "Password lama salah",
        });
      }
    }

    // Check if new password is different
    if (user.passwordHash) {
      const isSamePassword = await bcrypt.compare(
        validation.data.newPassword,
        user.passwordHash
      );

      if (isSamePassword) {
        return res.status(400).json({
          code: "SAME_PASSWORD",
          message: "Password baru tidak boleh sama dengan password lama",
        });
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(validation.data.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    console.log(`✅ Password updated for user: ${user.email}`);
    return res.json({
      code: "OK",
      message: "Password berhasil diperbarui",
    });
  } catch (error) {
    console.error("❌ Error changing password:", error);
    next(error);
  }
});

// ==========================================
// GET /users/me/stats - Get user statistics (optional)
// ==========================================
router.get("/me/stats", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    const stats = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    return res.json({
      totalBookings: stats?._count.bookings || 0,
      totalReviews: stats?._count.reviews || 0,
    });
  } catch (error) {
    console.error("❌ Error fetching user stats:", error);
    next(error);
  }
});

export default router;
