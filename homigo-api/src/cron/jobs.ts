import cron from "node-cron";
import dayjs from "dayjs";
import { prisma } from "../app";
import { sendMail, reminderEmailTemplate } from "../utils/email";

async function autoCancelUnpaid() {
  const threshold = dayjs().subtract(1, "hour").toDate();
  const toCancel = await prisma.booking.findMany({ where: { paymentStatus: "WAITING_PAYMENT", createdAt: { lt: threshold }, paymentProof: null } });
  for (const b of toCancel) {
    await prisma.booking.update({ where: { id: b.id }, data: { status: "CANCELLED" } });
  }
}

async function sendCheckinReminders() {
  const target = dayjs().add(1, "day").startOf("day");
  const nextDay = target.add(1, "day");
  const bookings = await prisma.booking.findMany({ where: { status: "CONFIRMED", checkInDate: { gte: target.toDate(), lt: nextDay.toDate() } }, include: { user: true, property: true } });
  for (const b of bookings) {
    await sendMail({ to: b.user.email, subject: "Homigo Check-in Reminder", html: reminderEmailTemplate({ property: b.property.name, checkIn: target.format("YYYY-MM-DD") }) });
  }
}

cron.schedule("*/10 * * * *", autoCancelUnpaid); // every 10 minutes
cron.schedule("0 9 * * *", sendCheckinReminders); // every day at 09:00

console.log("Cron jobs scheduled");
