import { Router } from "express";
import { prisma } from "../app";
import { z } from "zod";
import { requireAuth, requireRole } from "../middlewares/auth";
import dayjs from "dayjs";

const router = Router();

const seasonRateSchema = z
  .object({
    // Accept Prisma string IDs (cuid) instead of UUID-only
    propertyId: z.string().min(1).optional(),
    roomId: z.string().min(1).optional(),
    type: z.enum(["NOMINAL", "PERCENTAGE"]),
    value: z.number().positive("Value must be positive"),
    // Accept both full ISO datetime and date-only (YYYY-MM-DD)
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    const hasProperty = !!data.propertyId;
    const hasRoom = !!data.roomId;
    if (!hasProperty && !hasRoom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either propertyId or roomId must be provided",
        path: ["propertyId"],
      });
    }
    if (hasProperty && hasRoom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either propertyId or roomId, not both",
        path: ["roomId"],
      });
    }
    // Validate date strings are parseable
    const s = dayjs(data.startDate);
    const e = dayjs(data.endDate);
    if (!s.isValid()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid startDate",
        path: ["startDate"],
      });
    }
    if (!e.isValid()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid endDate",
        path: ["endDate"],
      });
    }
  });

router.get("/", requireAuth, requireRole("TENANT"), async (req, res, next) => {
  try {
    const { propertyId, roomId } = req.query;
    const where: any = {};

    if (propertyId) where.propertyId = propertyId as string;
    if (roomId) where.roomId = roomId as string;

    const rates = await prisma.seasonRate.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
      },
      orderBy: { startDate: "asc" },
    });

    console.log(`✅ Fetched ${rates.length} season rates`);
    return res.json(rates);
  } catch (error) {
    console.error("❌ Error fetching season rates:", error);
    next(error);
  }
});

router.post("/", requireAuth, requireRole("TENANT"), async (req, res, next) => {
  try {
    const validation = seasonRateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid data",
        errors: validation.error.issues,
      });
    }

    const data = validation.data;
    const user = (req as any).user as { id: string };

    if (data.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
        include: { tenant: true },
      });
      if (!property || !property.tenant || property.tenant.userId !== user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
    }

    if (data.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: data.roomId },
        include: { property: { include: { tenant: true } } },
      });
      if (
        !room ||
        !room.property ||
        !room.property.tenant ||
        room.property.tenant.userId !== user.id
      ) {
        return res.status(403).json({ message: "Unauthorized" });
      }
    }

    const startDate = dayjs(data.startDate);
    const endDate = dayjs(data.endDate);
    if (endDate.isBefore(startDate)) {
      return res.status(400).json({
        message: "End date must be after start date",
      });
    }

    const overlapWhere: any = {};
    if (data.propertyId) overlapWhere.propertyId = data.propertyId;
    if (data.roomId) overlapWhere.roomId = data.roomId;
    const existing = await prisma.seasonRate.findMany({
      where: overlapWhere,
      select: { id: true, startDate: true, endDate: true },
    });
    const hasOverlap = existing.some((r) => {
      const s1 = startDate;
      const e1 = endDate;
      const s2 = dayjs(r.startDate);
      const e2 = dayjs(r.endDate);
      return s1.isSame(e2) || e1.isSame(s2) || (s1.isBefore(e2) && e1.isAfter(s2)) || s1.isSame(s2) || e1.isSame(e2);
    });
    if (hasOverlap) {
      return res.status(400).json({
        message: "Season rate dates overlap with existing entries",
      });
    }

    const rate = await prisma.seasonRate.create({
      data: {
        propertyId: data.propertyId,
        roomId: data.roomId,
        type: data.type,
        value: data.value,
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
      },
    });

    console.log(`✅ Season rate created: ${rate.id}`);
    return res.status(201).json(rate);
  } catch (error) {
    console.error("❌ Error creating season rate:", error);
    next(error);
  }
});

router.put(
  "/:id",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const validation = seasonRateSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validation.error.issues,
        });
      }

      const data = validation.data;

      const existingRate = await prisma.seasonRate.findUnique({
        where: { id },
        include: {
          property: { include: { tenant: true } },
          room: { include: { property: { include: { tenant: true } } } },
        },
      });
      if (!existingRate) {
        return res.status(404).json({ message: "Season rate not found" });
      }

      const user = (req as any).user as { id: string };
      const ownerUserId =
        existingRate.room?.property?.tenant.userId ??
        existingRate.property?.tenant.userId;
      if (!ownerUserId || ownerUserId !== user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updateData: any = {
        type: data.type,
        value: data.value,
      };

      if (data.startDate) updateData.startDate = dayjs(data.startDate).toDate();
      if (data.endDate) updateData.endDate = dayjs(data.endDate).toDate();

      const newStart = dayjs(
        data.startDate ?? existingRate.startDate
      );
      const newEnd = dayjs(
        data.endDate ?? existingRate.endDate
      );
      if (newEnd.isBefore(newStart)) {
        return res.status(400).json({
          message: "End date must be after start date",
        });
      }
      const targetWhere: any = {};
      if (existingRate.propertyId) targetWhere.propertyId = existingRate.propertyId;
      if (existingRate.roomId) targetWhere.roomId = existingRate.roomId;
      const siblings = await prisma.seasonRate.findMany({
        where: { ...targetWhere, id: { not: id } },
        select: { id: true, startDate: true, endDate: true },
      });
      const overlapUpdate = siblings.some((r) => {
        const s1 = newStart;
        const e1 = newEnd;
        const s2 = dayjs(r.startDate);
        const e2 = dayjs(r.endDate);
        return s1.isSame(e2) || e1.isSame(s2) || (s1.isBefore(e2) && e1.isAfter(s2)) || s1.isSame(s2) || e1.isSame(e2);
      });
      if (overlapUpdate) {
        return res.status(400).json({
          message: "Season rate dates overlap with existing entries",
        });
      }

      const rate = await prisma.seasonRate.update({
        where: { id },
        data: updateData,
      });

      console.log(`✅ Season rate updated: ${id}`);
      return res.json(rate);
    } catch (error) {
      console.error("❌ Error updating season rate:", error);
      next(error);
    }
  }
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const existingRate = await prisma.seasonRate.findUnique({
        where: { id },
        include: {
          property: { include: { tenant: true } },
          room: { include: { property: { include: { tenant: true } } } },
        },
      });
      if (!existingRate) {
        return res.status(404).json({ message: "Season rate not found" });
      }
      const user = (req as any).user as { id: string };
      const ownerUserId =
        existingRate.room?.property?.tenant.userId ??
        existingRate.property?.tenant.userId;
      if (!ownerUserId || ownerUserId !== user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await prisma.seasonRate.delete({ where: { id } });
      console.log(`✅ Season rate deleted: ${id}`);
      return res.json({ message: "Season rate deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting season rate:", error);
      next(error);
    }
  }
);

export default router;
