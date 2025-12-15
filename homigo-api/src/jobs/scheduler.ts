import cron from "node-cron";
import { autoCancelExpiredBookings } from "./auto-cancel";
import { sendCheckInReminders } from "./email-reminders";

/**
 * Setup cron jobs for background tasks
 */
export function setupCronJobs() {
  cron.schedule("*/10 * * * *", async () => {
    await autoCancelExpiredBookings();
  });

  cron.schedule("0 9 * * *", async () => {
    await sendCheckInReminders();
  });
}
