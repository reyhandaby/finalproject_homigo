import { Router } from "express";
import { prisma } from "../../app";
import { requireAuth, requireRole } from "../../middlewares/auth";

const router = Router();

const getAuthUser = (req: any): { id: string } => {
  return (req as any).user;
};

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = getAuthUser(req);
    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      include: {
        paymentProof: true,
        room: { select: { id: true, name: true, basePrice: true } },
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            slug: true,
            images: { take: 1, orderBy: { createdAt: "asc" } },
          },
        },
        review: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Fetched ${bookings.length} bookings for user ${user.id}`);
    return res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching user bookings:", error);
    next(error);
  }
});

router.get(
  "/tenant",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const user = getAuthUser(req);
      const tenant = await prisma.tenantProfile.findUnique({
        where: { userId: user.id },
      });

      if (!tenant) {
        return res.status(403).json({ message: "Tenant profile not found" });
      }

      const bookings = await prisma.booking.findMany({
        where: { property: { tenantId: tenant.id } },
        include: {
          paymentProof: true,
          user: { select: { id: true, name: true, email: true } },
          room: { select: { id: true, name: true, basePrice: true } },
          property: { select: { id: true, name: true, city: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      console.log(
        `✅ Fetched ${bookings.length} bookings for tenant ${tenant.id}`
      );
      return res.json(bookings);
    } catch (error) {
      console.error("❌ Error fetching tenant bookings:", error);
      next(error);
    }
  }
);

router.get(
  "/tenant",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const user = getAuthUser(req);
      const tenant = await prisma.tenantProfile.findUnique({
        where: { userId: user.id },
        select: { id: true }, // cukup id
      });

      if (!tenant) {
        return res.status(403).json({ message: "Tenant profile not found" });
      }

      const bookings = await prisma.booking.findMany({
        where: { property: { tenantId: tenant.id } },
        include: {
          paymentProof: true,
          user: { select: { id: true, name: true, email: true } },
          room: { select: { id: true, name: true, basePrice: true } },
          property: { select: { id: true, name: true, city: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(bookings);
    } catch (error) {
      console.error("❌ Error fetching tenant bookings:", error);
      next(error);
    }
  }
);

// GET /bookings/:id
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = getAuthUser(req);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        paymentProof: true,
        room: true,
        property: {
          include: { images: { take: 5, orderBy: { createdAt: "asc" } }, tenant: true },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userId === user.id) return res.json(booking);

    const tenantProfile = await prisma.tenantProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (tenantProfile && booking.property?.tenantId === tenantProfile.id) {
      return res.json(booking);
    }

    return res.status(403).json({ message: "Unauthorized to view this booking" });
  } catch (error) {
    console.error("❌ Error fetching booking:", error);
    next(error);
  }
});



export default router;
