import { Router } from "express";
import { prisma } from "../app";
import { z } from "zod";
import { requireAuth, requireRole } from "../middlewares/auth";
import dayjs from "dayjs";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const schema = z.object({ bookingId: z.string(), rating: z.number().min(1).max(5), comment: z.string().optional() });
  const p = schema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: "Invalid data" });
  const booking = await prisma.booking.findUnique({ where: { id: p.data.bookingId } });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (dayjs(booking.checkOutDate).isAfter(dayjs())) return res.status(400).json({ message: "Can review after check-out" });
  const exist = await prisma.review.findUnique({ where: { bookingId: p.data.bookingId } });
  if (exist) return res.status(409).json({ message: "Already reviewed" });
  const user = (req as any).user as { id: string };
  const review = await prisma.review.create({ data: { bookingId: p.data.bookingId, userId: user.id, rating: p.data.rating, comment: p.data.comment } });
  return res.json(review);
});

router.post("/:id/reply", requireAuth, requireRole("TENANT"), async (req, res) => {
  const id = req.params.id;
  const schema = z.object({ reply: z.string().min(1) });
  const p = schema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: "Invalid data" });
  const updated = await prisma.review.update({ where: { id }, data: { reply: p.data.reply, repliedAt: new Date() } });
  return res.json(updated);
});

export default router;
router.get("/property/:id", async (req, res) => {
  const id = req.params.id;
  const reviews = await prisma.review.findMany({
    where: { booking: { propertyId: id } },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  const items = reviews.map((r) => ({ id: r.id, userName: r.user.name || r.user.email, rating: r.rating, comment: r.comment, reply: r.reply }));
  return res.json({ items });
});
