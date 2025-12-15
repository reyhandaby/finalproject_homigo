import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthUser {
  id: string;
  role: "USER" | "TENANT";
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    (req as any).user = payload;
    return next();
  } catch (e: any) {
    if (e?.name === "TokenExpiredError") {
      res.setHeader("WWW-Authenticate", 'Bearer error="invalid_token", error_description="token expired"');
      return res.status(401).json({ code: "TOKEN_EXPIRED", message: "Token expired" });
    }
    res.setHeader("WWW-Authenticate", 'Bearer error="invalid_token"');
    return res.status(401).json({ code: "INVALID_TOKEN", message: "Invalid token" });
  }
}

export function requireRole(role: AuthUser["role"]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== role) return res.status(403).json({ message: "Forbidden" });
    return next();
  };
}
