import { Router } from "express";
import { prisma } from "../app";
import { z } from "zod";
import { requireAuth, requireRole } from "../middlewares/auth";
import dayjs from "dayjs";

const router = Router();

const availabilitySchema = z.object({
  roomId: z.string().uuid(),
  date: z.string().datetime(),
  isAvailable: z.boolean(),
  overridePrice: z.number().positive().optional(),
});

// Get room availability for date range
router.get("/:roomId", async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = { roomId };
    if (startDate && endDate) {
      where.date = {
        gte: dayjs(startDate as string).toDate(),
        lte: dayjs(endDate as string).toDate(),
      };
    }

    const availabilities = await prisma.roomAvailability.findMany({
      where,
      orderBy: { date: "asc" },
    });

    console.log(
      `✅ Fetched ${availabilities.length} availability records for room ${roomId}`
    );
    return res.json(availabilities);
  } catch (error) {
    console.error("❌ Error fetching availability:", error);
    next(error);
  }
});

// Set room availability (single or bulk)
router.post("/", requireAuth, requireRole("TENANT"), async (req, res, next) => {
  try {
    const schema = z.object({
      items: z.array(availabilitySchema),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid data",
        errors: validation.error.issues,
      });
    }

    const { items } = validation.data;
    const user = (req as any).user as { id: string };

    // Verify ownership
    const roomIds = [...new Set(items.map((i) => i.roomId))];
    const rooms = await prisma.room.findMany({
      where: { id: { in: roomIds } },
      include: { property: { include: { tenant: true } } },
    });

    const unauthorized = rooms.some(
      (r) => r.property.tenant.userId !== user.id
    );
    if (unauthorized) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Upsert availabilities
    const results = await Promise.all(
      items.map((item) =>
        prisma.roomAvailability.upsert({
          where: {
            roomId_date: {
              roomId: item.roomId,
              date: dayjs(item.date).toDate(),
            },
          },
          update: {
            isAvailable: item.isAvailable,
            overridePrice: item.overridePrice,
          },
          create: {
            roomId: item.roomId,
            date: dayjs(item.date).toDate(),
            isAvailable: item.isAvailable,
            overridePrice: item.overridePrice,
          },
        })
      )
    );

    console.log(`✅ ${results.length} availability records updated`);
    return res.json(results);
  } catch (error) {
    console.error("❌ Error setting availability:", error);
    next(error);
  }
});

// Delete availability record
router.delete(
  "/:id",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.roomAvailability.delete({ where: { id } });
      console.log(`✅ Availability deleted: ${id}`);
      return res.json({ message: "Availability deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting availability:", error);
      next(error);
    }
  }
);

export default router;
