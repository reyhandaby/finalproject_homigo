import nodemailer from "nodemailer";
import { readFileSync } from "fs";
import { join } from "path";
import { env } from "../config/env";

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  requireTLS: true,
  auth: env.SMTP_USER
    ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      }
    : undefined,
});

const templatesDir = join(__dirname, "../../emails");

function loadTemplate(filename: string): string {
  try {
    return readFileSync(join(templatesDir, filename), "utf-8");
  } catch (error) {
    console.error(`Failed to load template: ${filename}`, error);
    return "";
  }
}

const templates = {
  verification: loadTemplate("verification.html"),
  reset: loadTemplate("reset.html"),
  bookingConfirmed: loadTemplate("booking-confirmed.html"),
  reminder: loadTemplate("reminder.html"),
};

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    return await transporter.sendMail({
      from: `Homigo <${env.SMTP_USER || "no-reply@homigo.local"}>`,
      to,
      subject,
      html,
    });
  } catch (e) {
    if (env.RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.SMTP_USER || "no-reply@homigo.local",
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        throw new Error(`Resend API failed: ${response.statusText}`);
      }

      return { messageId: "resend" } as any;
    }
    throw e;
  }
}

function replaceVars(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

export function verificationEmailTemplate(link: string) {
  if (!templates.verification) {
    return `Click the link below to verify and set your password (valid 1 hour):\n\n${link}`;
  }
  return replaceVars(templates.verification, { link });
}

export function resetPasswordTemplate(link: string) {
  if (!templates.reset) {
    return `Click the link below to set a new password:\n\n${link}`;
  }
  return replaceVars(templates.reset, { link });
}

export function bookingConfirmedTemplate(details: {
  property: string;
  room: string;
  checkIn: string;
  checkOut: string;
  total: string;
}) {
  if (!templates.bookingConfirmed) {
    return `Your booking is confirmed.\n\nProperty: ${details.property}\nRoom: ${details.room}\nCheck-in: ${details.checkIn}\nCheck-out: ${details.checkOut}\nTotal: ${details.total}`;
  }
  return replaceVars(templates.bookingConfirmed, {
    property: details.property,
    room: details.room,
    checkIn: details.checkIn,
    checkOut: details.checkOut,
    total: details.total,
  });
}

export function reminderEmailTemplate(details: {
  property: string;
  checkIn: string;
}) {
  if (!templates.reminder) {
    return `Reminder: check-in tomorrow for ${details.property} on ${details.checkIn}.`;
  }
  return replaceVars(templates.reminder, {
    property: details.property,
    checkIn: details.checkIn,
  });
}

export async function sendVerificationEmail(to: string, link: string) {
  return sendMail({
    to,
    subject: "Verify Your Email - Homigo",
    html: verificationEmailTemplate(link),
  });
}

export async function sendPasswordResetEmail(to: string, link: string) {
  return sendMail({
    to,
    subject: "Reset Your Password - Homigo",
    html: resetPasswordTemplate(link),
  });
}

export async function sendBookingConfirmation(
  to: string,
  details: {
    property: string;
    room: string;
    checkIn: string;
    checkOut: string;
    total: string;
  }
) {
  return sendMail({
    to,
    subject: "Booking Confirmed - Homigo",
    html: bookingConfirmedTemplate(details),
  });
}

export async function sendBookingReminder(
  to: string,
  details: { property: string; checkIn: string }
) {
  return sendMail({
    to,
    subject: "Check-in Reminder - Homigo",
    html: reminderEmailTemplate(details),
  });
}
