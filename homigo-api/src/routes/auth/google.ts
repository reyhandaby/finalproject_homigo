import { Router } from "express";
import { prisma } from "../../app";
import { env } from "../../config/env";
import jwt from "jsonwebtoken";
import axios from "axios";

const router = Router();

router.get("/", async (req, res) => {
  const role = (req.query.role as string) === "TENANT" ? "TENANT" : "USER";
  const state = Buffer.from(JSON.stringify({ role })).toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return res.json({ url: url.toString() });
});

router.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  const stateRaw = (req.query.state as string) || "";
  let desiredRole: "USER" | "TENANT" = "USER";

  try {
    const parsed = JSON.parse(Buffer.from(stateRaw, "base64url").toString());
    if (parsed?.role === "TENANT") desiredRole = "TENANT";
  } catch {}

  if (!code) return res.status(400).send("Missing code");

  try {
    const params = new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const tokenResp = await axios.post(
      "https://oauth2.googleapis.com/token",
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = tokenResp.data as { access_token: string };
    const userInfo = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const { email, name, picture } = userInfo.data as {
      email: string;
      name?: string;
      picture?: string;
    };

    if (!email) return res.status(400).send("Email not available from Google");

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          avatarUrl: picture,
          role: desiredRole,
          isVerified: true,
        },
      });

      if (desiredRole === "TENANT") {
        await prisma.tenantProfile.create({ data: { userId: user.id } });
      }
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          avatarUrl: picture,
          isVerified: true,
        },
      });
      user = await prisma.user.findUniqueOrThrow({ where: { email } });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const redirect = new URL(`${env.APP_URL}/auth/callback`);
    redirect.searchParams.set("token", token);
    redirect.searchParams.set("role", user.role);
    return res.redirect(302, redirect.toString());
  } catch (e: any) {
    const detail = e?.response?.data || e?.message || "";
    console.error("Google auth failed", detail);
    return res.status(500).json({
      code: "GOOGLE_OAUTH_FAILED",
      message: "Google auth gagal",
      detail,
    });
  }
});

export default router;
