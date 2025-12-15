import { Router } from "express";
import { prisma } from "../app";
import { requireAuth, requireRole } from "../middlewares/auth";
import { z } from "zod";
import { subDays, startOfMonth, endOfMonth, parseISO } from "date-fns";
import categoriesRouter from "./categories";
import facilitiesRouter from "./facilities";

const router = Router();

const roomSchema = z.object({
  name: z.string().min(1, "Room name required"),
  description: z.string().optional(),
  basePrice: z.number().positive("Price must be positive"),
  capacityGuests: z.number().int().min(1, "At least 1 guest capacity"),
  beds: z.number().int().min(0).default(1),
  baths: z.number().int().min(0).default(1),
});

router.use("/categories", categoriesRouter);
router.use("/facilities", facilitiesRouter);

// Dashboard stats
router.get("/dashboard/stats", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;

  try {
    // Hitung total properti milik tenant
    const tenantProfile = await prisma.tenantProfile.findUnique({
  where: { userId }
});

if (!tenantProfile) {
  return res.status(404).json({ message: "Tenant profile not found" });
}

const totalProperties = await prisma.property.count({
  where: { tenantId: tenantProfile.id }
});

    // Hitung total booking pada properti tenant
    const totalBookings = await prisma.booking.count({
      where: { property: { tenantId: tenantProfile.id } }
    });

    // Hitung total revenue (jika ada field "totalPrice")
    const revenueAgg = await prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: { property: { tenantId: tenantProfile.id } }
    });

    res.json({
      totalProperties,
      totalBookings,
      revenue: revenueAgg._sum.totalPrice || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching stats" });
  }
});

// Booking list
router.get("/bookings", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;

  try {
    const bookings = await prisma.booking.findMany({
      where: { property: { tenantId: userId } },
      include: { property: true, user: true },
      orderBy: { createdAt: "desc" }
    });

    res.json({ data: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// Properties
router.get("/properties", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    // cari tenant profile milik user
    const tenantProfile = await prisma.tenantProfile.findUnique({
      where: { userId },
    });

    if (!tenantProfile) {
      return res.status(404).json({
        code: "TENANT_NOT_FOUND",
        message: "Tenant profile tidak ditemukan untuk user ini",
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const q = (req.query.q as string) || "";

    // build where clause: tenantId + optional search
    const where: any = {
      tenantId: tenantProfile.id,
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          images: true,
          rooms: { select: { id: true, name: true, basePrice: true } },
          category: true,
        },
      }),
      prisma.property.count({ where }),
    ]);

    return res.json({
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ tenant/properties error:", err);
    next(err);
  }
});
router.get("/properties/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Ambil tenant profile
    const tenantProfile = await prisma.tenantProfile.findUnique({
      where: { userId },
    });

    if (!tenantProfile) {
      return res.status(404).json({ message: "Tenant profile not found" });
    }

    // Cari property berdasarkan tenantId + id
    const property = await prisma.property.findFirst({
      where: {
        id,
        tenantId: tenantProfile.id,
      },
      include: {
        images: true,
        category: true,
        rooms: true,
      },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json(property);
  } catch (err) {
    console.error("❌ Error fetching property:", err);
    res.status(500).json({ message: "Error fetching property" });
  }
});
router.put("/properties/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const tenantProfile = await prisma.tenantProfile.findUnique({
      where: { userId },
    });

    if (!tenantProfile) {
      return res.status(404).json({ message: "Tenant profile not found" });
    }

    const existing = await prisma.property.findFirst({
      where: { id, tenantId: tenantProfile.id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Property not found" });
    }

    const updated = await prisma.property.update({
      where: { id },
      data: req.body,
    });

    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating property:", err);
    res.status(500).json({ message: "Failed to update property" });
  }
});
router.delete("/properties/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const tenantProfile = await prisma.tenantProfile.findUnique({
      where: { userId },
    });

    if (!tenantProfile) {
      return res.status(404).json({ message: "Tenant profile not found" });
    }

    const existing = await prisma.property.findFirst({
      where: { id, tenantId: tenantProfile.id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Property not found" });
    }

    await prisma.property.delete({ where: { id } });

    res.json({ message: "Property deleted" });
  } catch (err) {
    console.error("❌ Error deleting property:", err);
    res.status(500).json({ message: "Failed to delete property" });
  }
});


router.get("/reports", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    // Ambil tenant profile user
    const tenantProfile = await prisma.tenantProfile.findUnique({
      where: { userId },
    });

    if (!tenantProfile) {
      return res.status(404).json({
        code: "TENANT_NOT_FOUND",
        message: "Tenant profile tidak ditemukan untuk user ini",
      });
    }

    // Parse query range
    const toQuery = (req.query.to as string) || undefined;
    const fromQuery = (req.query.from as string) || undefined;

    const toDate = toQuery ? parseISO(toQuery) : new Date();
    const fromDate = fromQuery
      ? parseISO(fromQuery)
      : subDays(new Date(), 30); // default 30 hari terakhir

    // Basic where clause to target bookings for tenant's properties and date range
    const baseWhere: any = {
      property: { tenantId: tenantProfile.id },
      createdAt: { gte: fromDate, lte: toDate },
    };

    // Total bookings
    const totalBookings = await prisma.booking.count({ where: baseWhere });

    // Total revenue
    const revenueAgg = await prisma.booking.aggregate({
      where: baseWhere,
      _sum: { totalPrice: true },
    });
    const totalRevenue = (revenueAgg._sum?.totalPrice ?? 0).toString();

    // Bookings grouped by property (count + sum)
    const groupByProperty = await prisma.booking.groupBy({
      by: ["propertyId"],
      where: baseWhere,
      _count: { id: true },
      _sum: { totalPrice: true },
    });

    const propertyIds = groupByProperty.map((g) => g.propertyId);
    const properties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true, name: true, slug: true },
    });

    const bookingsByProperty = groupByProperty.map((g) => {
      const prop = properties.find((p) => p.id === g.propertyId);
      return {
        propertyId: g.propertyId,
        name: prop?.name ?? null,
        slug: prop?.slug ?? null,
        count: g._count?.id ?? 0,
        revenue: (g._sum?.totalPrice ?? 0).toString(),
      };
    });

    // Revenue by month (for the last 6 months or between from/to range if range smaller)
    // Build months from 'fromDate' to 'toDate' but limit to last 12 months to avoid heavy queries
    const months: { start: Date; end: Date; label: string }[] = [];
    const maxMonths = 12;
    // start at the startOfMonth(fromDate) and iterate months
    let cursor = startOfMonth(fromDate);
    while (cursor <= toDate && months.length < maxMonths) {
      const start = startOfMonth(cursor);
      const end = endOfMonth(cursor);
      const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
      months.push({ start, end, label });
      // move to next month
      cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    }

    // For each month, run aggregate (could be optimized with raw SQL if needed)
    const revenueByMonth = await Promise.all(
      months.map(async (m) => {
        const agg = await prisma.booking.aggregate({
          where: {
            property: { tenantId: tenantProfile.id },
            createdAt: { gte: m.start, lte: m.end },
            status: { not: "CANCELLED" }, // contoh filter, sesuaikan jika perlu
          },
          _sum: { totalPrice: true },
        });
        return {
          month: m.label,
          revenue: (agg._sum?.totalPrice ?? 0).toString(),
        };
      })
    );

    return res.json({
      totalBookings,
      totalRevenue,
      bookingsByProperty,
      revenueByMonth,
    });
  } catch (err) {
    console.error("❌ tenant/reports error:", err);
    next(err);
  }
});

// POST room
router.post("/:propertyId/rooms", requireAuth, requireRole("TENANT"), async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const validation = roomSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Invalid data", errors: validation.error.issues });
    }

    const data = validation.data;
    const user = (req as any).user;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { tenant: true },
    });

    if (!property || property.tenant.userId !== user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const room = await prisma.room.create({
      data: { ...data, propertyId },
      include: { images: true },
    });

    return res.status(201).json(room);
  } catch (error) {
    next(error);
  }
});

export default router;
