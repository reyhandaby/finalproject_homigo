import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../app";
import { env } from "../../config/env";
import { sendMail, verificationEmailTemplate } from "../../utils/email";
import dayjs from "dayjs";
import crypto from "crypto";

const router = Router();

function cryptoRandomString(): string {
  return crypto.randomBytes(32).toString("hex");
}

const registerSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  name: z.string().min(1, "Nama wajib diisi"),
  role: z.enum(["USER", "TENANT"]),
});

router.post("/register", async (req, res, next) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        code: "INVALID_DATA",
        message: "Data tidak valid",
        errors: parse.error.flatten(),
      });
    }

    const { email, name, role } = parse.data;
    const exist = await prisma.user.findUnique({ where: { email } });

    if (exist) {
      if (exist.isVerified) {
        return res.status(409).json({
          code: "EMAIL_EXISTS",
          message: "Email sudah terdaftar dan terverifikasi",
        });
      }

      console.log(`⚠️ User exists but not verified: ${email}. Resending...`);
      await prisma.emailVerificationToken.deleteMany({
        where: { userId: exist.id, usedAt: null },
      });

      const token = cryptoRandomString();
      await prisma.emailVerificationToken.create({
        data: {
          userId: exist.id,
          token,
          expiresAt: dayjs().add(1, "hour").toDate(),
        },
      });

      const link = `${env.APP_URL}/verify?token=${token}`;
      await sendMail({
        to: email,
        subject: "Verify your Homigo account",
        html: verificationEmailTemplate(link),
      });

      console.log(`✅ Verification email resent to: ${email}`);
      return res.json({
        code: "OK",
        message: "Email verifikasi telah dikirim ulang",
      });
    }

    const user = await prisma.user.create({
      data: { email, name, role },
    });

    if (role === "TENANT") {
      await prisma.tenantProfile.create({ data: { userId: user.id } });
    }

    const token = cryptoRandomString();
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: dayjs().add(1, "hour").toDate(),
      },
    });

    const link = `${env.APP_URL}/verify?token=${token}`;
    await sendMail({
      to: email,
      subject: "Verify your Homigo account",
      html: verificationEmailTemplate(link),
    });

    console.log(`✅ User registered: ${email}`);
    return res.json({
      code: "OK",
      message: "Email verifikasi telah dikirim",
    });
  } catch (e: any) {
    console.error("❌ Register failed:", e?.message || e);
    next(e);
  }
});

export default router;
