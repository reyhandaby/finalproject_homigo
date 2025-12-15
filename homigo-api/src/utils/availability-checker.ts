import { prisma } from "../app";
import dayjs from "dayjs";

interface AvailabilityCheckParams {
  roomId: string;
  checkInDate: Date;
  checkOutDate: Date;
  excludeBookingId?: string;
}

interface AvailabilityResult {
  isAvailable: boolean;
  reason?: string;
  unavailableDates?: string[];
}

export async function checkRoomAvailability(
  params: AvailabilityCheckParams
): Promise<AvailabilityResult> {
  const { roomId, checkInDate, checkOutDate, excludeBookingId } = params;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      availabilities: {
        where: {
          date: {
            gte: checkInDate,
            lt: checkOutDate,
          },
        },
      },
      bookings: {
        where: {
          id: excludeBookingId ? { not: excludeBookingId } : undefined,
          status: {
            in: ["PENDING", "CONFIRMED", "WAITING_CONFIRMATION"],
          },
          OR: [
            {
              checkInDate: { lt: checkOutDate },
              checkOutDate: { gt: checkInDate },
            },
          ],
        },
      },
    },
  });

  if (!room) {
    return {
      isAvailable: false,
      reason: "Room not found",
    };
  }

  if (room.bookings.length > 0) {
    return {
      isAvailable: false,
      reason: "Room is already booked for selected dates",
      unavailableDates: room.bookings.map((b) => ({
        checkIn: dayjs(b.checkInDate).format("YYYY-MM-DD"),
        checkOut: dayjs(b.checkOutDate).format("YYYY-MM-DD"),
      })) as any,
    };
  }

  const blockedDates = room.availabilities.filter((a) => !a.isAvailable);
  if (blockedDates.length > 0) {
    return {
      isAvailable: false,
      reason: "Room is not available for some selected dates",
      unavailableDates: blockedDates.map((a) =>
        dayjs(a.date).format("YYYY-MM-DD")
      ),
    };
  }

  return {
    isAvailable: true,
  };
}
