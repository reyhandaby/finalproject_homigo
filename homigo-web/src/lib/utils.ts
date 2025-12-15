import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getBookingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Menunggu Pembayaran",
    WAITING_CONFIRMATION: "Menunggu Konfirmasi",
    CONFIRMED: "Dikonfirmasi",
    REJECTED: "Ditolak",
    CANCELLED: "Dibatalkan",
    COMPLETED: "Selesai",
  };
  return labels[status] || status;
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Belum Bayar",
    WAITING_PAYMENT: "Menunggu Pembayaran",
    WAITING_CONFIRMATION: "Menunggu Konfirmasi",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
  };
  return labels[status] || status;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const calculateNights = (
  checkIn: string | Date,
  checkOut: string | Date
): number => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

/**
 * Helper: coerce arbitrary input into a finite number or fallback.
 * - returns fallback when value is "", null, undefined, or cannot be coerced.
 */
export function parseNumber(value: any, fallback: number | null = null): number | null {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Sanitize payload for creating/updating a Room.
 * - Ensure numeric fields are numbers (not strings).
 * - Provide sensible defaults for beds/baths.
 */
export function sanitizeRoomPayload(raw: any) {
  const basePrice = parseNumber(raw.basePrice, null);
  const capacityGuests = parseNumber(raw.capacityGuests, null);
  const beds = parseNumber(raw.beds, 1);
  const baths = parseNumber(raw.baths, 1);

  return {
    name: (raw.name ?? "").toString().trim(),
    description: raw.description ?? null,
    basePrice,
    capacityGuests,
    beds,
    baths,
  };
}
