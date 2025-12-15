import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../app";
import dayjs from "dayjs";
import bcrypt from "bcryptjs";

const router = Router();

const verifySchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

router.post("/verify", async (req, res, next) => {
  try {
    const parse = verifySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        code: "INVALID_DATA",
        message: "Data tidak valid",
        errors: parse.error.issues,
      });
    }

    const { token, password } = parse.data;
    const vt = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!vt) {
      return res.status(404).json({
        code: "TOKEN_NOT_FOUND",
        message: "Token tidak ditemukan atau sudah tidak valid",
      });
    }

    if (vt.usedAt) {
      return res.status(409).json({
        code: "TOKEN_USED",
        message: "Token sudah digunakan. Silakan request email verifikasi baru",
      });
    }

    if (dayjs(vt.expiresAt).isBefore(dayjs())) {
      return res.status(410).json({
        code: "TOKEN_EXPIRED",
        message: "Token kedaluwarsa. Silakan request email verifikasi baru",
      });
    }

    const hash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: vt.userId },
        data: { isVerified: true, passwordHash: hash },
      }),
      prisma.emailVerificationToken.update({
        where: { id: vt.id },
        data: { usedAt: new Date() },
      }),
    ]);

    console.log(`✅ Email verified for user: ${vt.userId}`);
    return res.json({
      code: "OK",
      message: "Email terverifikasi",
    });
  } catch (e: any) {
    console.error("❌ Verify failed:", e?.message || e);
    next(e);
  }
});

export default router;
