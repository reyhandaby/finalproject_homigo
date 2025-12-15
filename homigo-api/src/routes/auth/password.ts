import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../app";
import { env } from "../../config/env";
import { sendMail, resetPasswordTemplate } from "../../utils/email";
import dayjs from "dayjs";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const router = Router();

function cryptoRandomString(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/forgot-password", async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email("Format email tidak valid"),
    });
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        code: "INVALID_DATA",
        message: "Format email tidak valid",
        errors: parse.error.issues,
      });
    }

    const { email } = parse.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      const token = cryptoRandomString();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: dayjs().add(1, "hour").toDate(),
        },
      });

      const link = `${env.APP_URL}/reset-password?token=${token}`;
      try {
        await sendMail({
          to: email,
          subject: "Reset Password - Homigo",
          html: resetPasswordTemplate(link),
        });
        console.log(`✅ Reset password email sent to: ${email}`);
      } catch (emailError) {
        console.error("❌ Failed to send reset email:", emailError);
        return res.status(500).json({
          code: "EMAIL_FAILED",
          message: "Gagal mengirim email. Silakan coba lagi.",
        });
      }
    } else {
      console.log(`⚠️ Reset requested for non-existent email: ${email}`);
    }

    return res.json({
      code: "OK",
      message: "Jika email terdaftar, link reset password telah dikirim",
    });
  } catch (e: any) {
    console.error("❌ Forgot password failed:", e?.message || e);
    next(e);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const schema = z.object({
      token: z.string().min(1, "Token wajib diisi"),
      password: z.string().min(8, "Password minimal 8 karakter"),
    });
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        code: "INVALID_DATA",
        message: "Data tidak valid",
        errors: parse.error.issues,
      });
    }

    const { token, password } = parse.data;
    const rt = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!rt) {
      return res.status(404).json({
        code: "TOKEN_NOT_FOUND",
        message: "Token tidak valid atau sudah kedaluwarsa",
      });
    }

    if (rt.usedAt) {
      return res.status(409).json({
        code: "TOKEN_USED",
        message: "Token sudah digunakan. Silakan request link reset baru",
      });
    }

    if (dayjs(rt.expiresAt).isBefore(dayjs())) {
      return res.status(410).json({
        code: "TOKEN_EXPIRED",
        message: "Token kedaluwarsa. Silakan request link baru",
      });
    }

    if (rt.user.passwordHash) {
      const isSame = await bcrypt.compare(password, rt.user.passwordHash);
      if (isSame) {
        return res.status(400).json({
          code: "SAME_PASSWORD",
          message: "Password baru tidak boleh sama dengan password lama",
        });
      }
    }

    const hash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: rt.userId },
        data: { passwordHash: hash },
      }),
      prisma.passwordResetToken.update({
        where: { id: rt.id },
        data: { usedAt: new Date() },
      }),
    ]);

    console.log(`✅ Password reset successful for user: ${rt.user.email}`);
    return res.json({
      code: "OK",
      message: "Password berhasil diperbarui",
    });
  } catch (e: any) {
    console.error("❌ Reset password failed:", e?.message || e);
    next(e);
  }
});

export default router;
