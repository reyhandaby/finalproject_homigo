export const APP_NAME = "Homigo";
export const APP_DESCRIPTION = "Property Rental Platform";

export const BOOKING_STATUS = {
  PENDING: "PENDING",
  WAITING_CONFIRMATION: "WAITING_CONFIRMATION",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  WAITING_PAYMENT: "WAITING_PAYMENT",
  WAITING_CONFIRMATION: "WAITING_CONFIRMATION",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const USER_ROLE = {
  USER: "USER",
  TENANT: "TENANT",
} as const;

export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];
