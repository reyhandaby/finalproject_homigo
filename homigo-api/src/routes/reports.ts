import { Router } from "express";
import { prisma } from "../app";
import { z } from "zod";
import { requireAuth, requireRole } from "../middlewares/auth";
import dayjs from "dayjs";

const router = Router();

const reportQuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  sort: z.enum(["date", "total"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
  format: z.enum(["json", "csv"]).optional().default("json"),
});

router.get(
  "/sales",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const validation = reportQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid query parameters",
          errors: validation.error.issues,
        });
      }

      const { start, end, sort, order, format } = validation.data;
      const user = (req as any).user as { id: string };

      const tenant = await prisma.tenantProfile.findUnique({
        where: { userId: user.id },
      });

      if (!tenant) {
        return res.status(403).json({ message: "Tenant profile not found" });
      }

      const where: any = {
        property: { tenantId: tenant.id },
        status: "CONFIRMED",
        paymentStatus: "APPROVED",
      };

      if (start) where.checkInDate = { gte: dayjs(start).toDate() };
      if (end) {
        where.checkInDate = {
          ...where.checkInDate,
          lte: dayjs(end).toDate(),
        };
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          property: { select: { id: true, name: true } },
          room: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy:
          sort === "date" ? { checkInDate: order } : { totalPrice: order },
      });

      const salesByDate: Record<string, number> = {};
      bookings.forEach((b) => {
        const date = dayjs(b.checkInDate).format("YYYY-MM-DD");
        salesByDate[date] = (salesByDate[date] || 0) + Number(b.totalPrice);
      });

      const items = Object.entries(salesByDate).map(([date, total]) => ({
        date,
        total,
      }));

      if (format === "csv") {
        const csv = [
          "Date,Total",
          ...items.map((i) => `${i.date},${i.total}`),
        ].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=sales-report.csv"
        );
        return res.send(csv);
      }

      console.log(`✅ Sales report generated: ${items.length} records`);
      return res.json({ items, total: items.length });
    } catch (error) {
      console.error("❌ Error generating sales report:", error);
      next(error);
    }
  }
);

router.get(
  "/properties",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const { propertyId, month, year } = req.query;
      const user = (req as any).user as { id: string };

      const tenant = await prisma.tenantProfile.findUnique({
        where: { userId: user.id },
      });

      if (!tenant) {
        return res.status(403).json({ message: "Tenant profile not found" });
      }

      const where: any = { tenantId: tenant.id };
      if (propertyId) where.id = propertyId as string;

      const properties = await prisma.property.findMany({
        where,
        include: {
          rooms: {
            include: {
              availabilities: {
                where:
                  month && year
                    ? {
                        date: {
                          gte: dayjs(`${year}-${month}-01`)
                            .startOf("month")
                            .toDate(),
                          lte: dayjs(`${year}-${month}-01`)
                            .endOf("month")
                            .toDate(),
                        },
                      }
                    : undefined,
              },
              bookings: {
                where:
                  month && year
                    ? {
                        checkInDate: {
                          gte: dayjs(`${year}-${month}-01`)
                            .startOf("month")
                            .toDate(),
                          lte: dayjs(`${year}-${month}-01`)
                            .endOf("month")
                            .toDate(),
                        },
                        status: { in: ["CONFIRMED", "PENDING"] },
                      }
                    : undefined,
              },
            },
          },
        },
      });

      console.log(
        `✅ Property report generated for ${properties.length} properties`
      );
      return res.json(properties);
    } catch (error) {
      console.error("❌ Error generating property report:", error);
      next(error);
    }
  }
);


router.get(
  "/tenant/summary",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      // terima kedua bentuk param tanggal untuk kompatibilitas
      const rawStart = (req.query.start as string) || (req.query.startDate as string);
      const rawEnd = (req.query.end as string) || (req.query.endDate as string);

      const user = (req as any).user as { id: string };

      const tenant = await prisma.tenantProfile.findUnique({
        where: { userId: user.id },
      });

      if (!tenant) {
        return res.status(403).json({ message: "Tenant profile not found" });
      }

      // helper buat where date range (gunakan checkInDate; ubah ke createdAt kalau perlu)
      const dateWhere: any = {};
      if (rawStart) dateWhere.gte = dayjs(rawStart).startOf("day").toDate();
      if (rawEnd) dateWhere.lte = dayjs(rawEnd).endOf("day").toDate();

      const baseWhere: any = {
        property: { tenantId: tenant.id },
      };

      // total bookings (semua status)
      const totalBookings = await prisma.booking.count({
        where: {
          ...baseWhere,
          ...(rawStart || rawEnd ? { checkInDate: dateWhere } : {}),
        },
      });

      // completed and cancelled counts
      const [completedBookings, cancelledBookings] = await Promise.all([
        prisma.booking.count({
          where: {
            ...baseWhere,
            status: "CONFIRMED",
            ...(rawStart || rawEnd ? { createdAt: dateWhere } : {}),
          },
        }),
        prisma.booking.count({
          where: {
            ...baseWhere,
            status: "CANCELLED",
            ...(rawStart || rawEnd ? { checkInDate: dateWhere } : {}),
          },
        }),
      ]);

      // total revenue: sum totalPrice untuk bookings yang dianggap revenue (CONFIRMED + APPROVED)
      const revenueAggregate = await prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          ...baseWhere,
          status: "CONFIRMED",
          paymentStatus: "APPROVED",
          ...(rawStart || rawEnd ? { checkInDate: dateWhere } : {}),
        },
      });

      const totalRevenue = Number(revenueAggregate._sum.totalPrice ?? 0);

      // ambil bookings revenue untuk dihimpun per bulan (simple & flexible)
      const revenueBookings = await prisma.booking.findMany({
        where: {
          ...baseWhere,
          status: "CONFIRMED",
          paymentStatus: "APPROVED",
          ...(rawStart || rawEnd ? { checkInDate: dateWhere } : {}),
        },
        select: { totalPrice: true, checkInDate: true, property: { select: { id: true, name: true } } },
      });

      // aggregate monthlyRevenue (YYYY-MM)
      const monthlyMap: Record<string, number> = {};
      revenueBookings.forEach((b) => {
        const m = dayjs(b.checkInDate).format("YYYY-MM");
        monthlyMap[m] = (monthlyMap[m] || 0) + Number(b.totalPrice);
      });
      const monthlyRevenue = Object.entries(monthlyMap).map(([month, revenue]) => ({ month, revenue }));

      // topProperties: group by property id
      const propMap: Record<string, { id: string; name: string; revenue: number; bookings: number }> = {};
      revenueBookings.forEach((b) => {
        const pid = b.property.id;
        if (!propMap[pid]) propMap[pid] = { id: pid, name: b.property.name ?? "Unknown", revenue: 0, bookings: 0 };
        propMap[pid].revenue += Number(b.totalPrice);
        propMap[pid].bookings += 1;
      });
      const topProperties = Object.values(propMap).sort((a, b) => b.revenue - a.revenue);

      return res.json({
        totalRevenue,
        totalBookings,
        completedBookings,
        cancelledBookings,
        monthlyRevenue,
        topProperties,
      });
    } catch (error) {
      console.error("❌ Error generating tenant summary report:", error);
      next(error);
    }
  }
);
export default router;
