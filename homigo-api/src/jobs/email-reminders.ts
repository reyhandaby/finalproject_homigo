import { prisma } from "../app";
import dayjs from "dayjs";
import { sendMail } from "../utils/email";

/**
 * Send H-1 check-in reminder emails
 * Run this job daily at 9:00 AM
 */
export async function sendCheckInReminders() {
  try {
    console.log("📧 Running check-in reminder job...");

    const tomorrow = dayjs().add(1, "day").startOf("day").toDate();
    const dayAfterTomorrow = dayjs().add(2, "day").startOf("day").toDate();

    const bookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        paymentStatus: "APPROVED",
        checkInDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
      },
      include: {
        user: { select: { email: true, name: true } },
        property: { select: { name: true, address: true, city: true } },
        room: { select: { name: true } },
      },
    });

    if (bookings.length === 0) {
      console.log("✅ No check-in reminders to send");
      return;
    }

    console.log(`📨 Sending ${bookings.length} check-in reminders`);

    for (const booking of bookings) {
      if (!booking.user.email) continue;

      try {
        await sendMail({
          to: booking.user.email,
          subject: "Reminder: Check-in Tomorrow 🏨",
          html: `
            <h2>Check-in Reminder</h2>
            <p>Hi ${booking.user.name || "there"},</p>
            <p>This is a friendly reminder that your check-in is <strong>tomorrow</strong>!</p>
            <hr>
            <h3>Booking Details:</h3>
            <p><strong>Property:</strong> ${booking.property.name}</p>
            <p><strong>Room:</strong> ${booking.room.name}</p>
            <p><strong>Check-in:</strong> ${dayjs(booking.checkInDate).format(
              "DD MMMM YYYY"
            )}</p>
            <p><strong>Check-out:</strong> ${dayjs(booking.checkOutDate).format(
              "DD MMMM YYYY"
            )}</p>
            <p><strong>Guests:</strong> ${booking.guests} person(s)</p>
            <p><strong>Address:</strong> ${
              booking.property.address || booking.property.city
            }</p>
            <hr>
            <p>Have a great stay!</p>
            <p>Best regards,<br>Homigo Team</p>
          `,
        });

        console.log(
          `✅ Reminder sent to ${booking.user.email} for booking ${booking.id}`
        );
      } catch (emailError) {
        console.error(
          `⚠️ Failed to send reminder to ${booking.user.email}:`,
          emailError
        );
      }
    }

    console.log(`✅ Sent ${bookings.length} check-in reminders`);
  } catch (error) {
    console.error("❌ Error in email reminder job:", error);
  }
}
