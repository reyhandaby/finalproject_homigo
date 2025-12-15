import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../app";
import { env } from "../../config/env";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = Router();

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

router.post("/login", async (req, res, next) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        code: "INVALID_DATA",
        message: "Data tidak valid",
        errors: parse.error.issues,
      });
    }

    const { email, password } = parse.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({
        code: "INVALID_CREDENTIALS",
        message: "Email atau password salah",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        code: "EMAIL_NOT_VERIFIED",
        message: "Email belum diverifikasi. Silakan cek inbox Anda",
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        code: "INVALID_CREDENTIALS",
        message: "Email atau password salah",
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({
        code: "INVALID_CREDENTIALS",
        message: "Email atau password salah",
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log(`✅ User logged in: ${email}`);
    return res.json({ code: "OK", token });
  } catch (e: any) {
    console.error("❌ Login failed:", e?.message || e);
    next(e);
  }
});

export default router;
