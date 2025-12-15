import { Router } from "express";
import { prisma } from "../../app";
import { requireAuth, requireRole } from "../../middlewares/auth";
import dayjs from "dayjs";
import { sendMail, bookingConfirmedTemplate } from "../../utils/email";

const router = Router();

const getAuthUser = (req: any): { id: string } => {
  return (req as any).user;
};

router.post(
  "/:id/approve",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const booking = await prisma.booking.update({
        where: { id },
        data: {
          paymentStatus: "APPROVED",
          status: "CONFIRMED",
        },
        include: {
          user: true,
          property: true,
          room: true,
        },
      });

      await prisma.transaction.upsert({
        where: { bookingId: id },
        create: {
          bookingId: id,
          amount: booking.totalPrice,
          paidAt: new Date(),
        },
        update: {
          amount: booking.totalPrice,
          paidAt: new Date(),
        },
      });

      if (booking.user.email) {
        try {
          await sendMail({
            to: booking.user.email,
            subject: "Homigo - Booking Confirmed ✅",
            html: bookingConfirmedTemplate({
              property: booking.property.name,
              room: booking.room.name,
              checkIn: dayjs(booking.checkInDate).format("DD MMMM YYYY"),
              checkOut: dayjs(booking.checkOutDate).format("DD MMMM YYYY"),
              total: `Rp ${booking.totalPrice.toLocaleString()}`,
            }),
          });
          console.log(`📧 Confirmation email sent to ${booking.user.email}`);
        } catch (emailError) {
          console.error("⚠️ Email sending failed:", emailError);
        }
      }

      console.log(`✅ Booking approved: ${id}`);
      return res.json({
        message: "Booking approved successfully",
        booking,
      });
    } catch (error) {
      console.error("❌ Error approving booking:", error);
      next(error);
    }
  }
);

router.post(
  "/:id/reject",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const booking = await prisma.booking.update({
        where: { id },
        data: { paymentStatus: "REJECTED" },
      });

      console.log(`❌ Payment rejected for booking: ${id}`);
      return res.json({
        message: "Payment proof rejected",
        booking,
      });
    } catch (error) {
      console.error("❌ Error rejecting booking:", error);
      next(error);
    }
  }
);

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = getAuthUser(req);

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId !== user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (booking.status === "CONFIRMED") {
      return res.status(400).json({
        message: "Cannot cancel confirmed bookings",
      });
    }

    await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    console.log(`🚫 Booking cancelled: ${id}`);
    return res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("❌ Error cancelling booking:", error);
    next(error);
  }
});

export default router;
