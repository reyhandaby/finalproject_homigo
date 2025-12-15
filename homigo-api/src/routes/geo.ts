import { Router } from "express";
import axios from "axios";
import { z } from "zod";
import { env } from "../config/env";

const router = Router();

router.get("/cities", async (req, res) => {
  const schema = z.object({ q: z.string().min(1) });
  const p = schema.safeParse(req.query);
  if (!p.success) return res.status(400).json({ message: "Query required" });
  if (!env.RESEND_API_KEY && !process.env.OPENCAGE_API_KEY) {
    // expecting OPENCAGE_API_KEY set; if not, return empty
  }
  const key = process.env.OPENCAGE_API_KEY || "";
  try {
    const resp = await axios.get("https://api.opencagedata.com/geocode/v1/json", { params: { q: p.data.q, key, limit: 5 } });
    const cities = (resp.data.results || []).map((r: any) => ({ city: r.components.city || r.components.town || r.components.village || r.components.state || r.formatted, lat: r.geometry.lat, lng: r.geometry.lng }));
    return res.json({ items: cities });
  } catch (e) {
    return res.status(500).json({ message: "Failed to fetch from OpenCage" });
  }
});

export default router;
