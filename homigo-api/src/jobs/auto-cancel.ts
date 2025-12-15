import { prisma } from "../app";
import dayjs from "dayjs";

/**
 * Auto-cancel bookings that are PENDING payment for more than 2 hours
 * Run this job every 10 minutes via cron
 */
export async function autoCancelExpiredBookings() {
  try {
    console.log("🔄 Running auto-cancel job...");

    const twoHoursAgo = dayjs().subtract(2, "hours").toDate();

    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        paymentStatus: "PENDING",
        createdAt: {
          lt: twoHoursAgo,
        },
      },
      include: {
        user: { select: { email: true, name: true } },
        property: { select: { name: true } },
        room: { select: { name: true } },
      },
    });

    if (expiredBookings.length === 0) {
      console.log("✅ No expired bookings to cancel");
      return;
    }

    console.log(`⚠️ Found ${expiredBookings.length} expired bookings`);

    const cancelledIds = expiredBookings.map((b) => b.id);
    await prisma.booking.updateMany({
      where: { id: { in: cancelledIds } },
      data: {
        status: "CANCELLED",
        paymentStatus: "REJECTED",
      },
    });

    const { sendMail } = await import("../utils/email");

    for (const booking of expiredBookings) {
      if (booking.user.email) {
        try {
          await sendMail({
            to: booking.user.email,
            subject: "Booking Cancelled - Payment Timeout",
            html: `
              <h2>Booking Cancelled</h2>
              <p>Hi ${booking.user.name || "there"},</p>
              <p>Your booking for <strong>${booking.property.name} - ${
              booking.room.name
            }</strong> has been automatically cancelled due to payment timeout.</p>
              <p>Check-in: ${dayjs(booking.checkInDate).format(
                "DD MMMM YYYY"
              )}</p>
              <p>Please make a new booking if you still want to reserve this room.</p>
              <p>Thank you,<br>Homigo Team</p>
            `,
          });
          console.log(`📧 Cancellation email sent to ${booking.user.email}`);
        } catch (emailError) {
          console.error(
            `⚠️ Failed to send email to ${booking.user.email}:`,
            emailError
          );
        }
      }
    }

    console.log(`✅ Auto-cancelled ${cancelledIds.length} bookings`);
  } catch (error) {
    console.error("❌ Error in auto-cancel job:", error);
  }
}
