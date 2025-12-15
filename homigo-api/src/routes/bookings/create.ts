import { Router } from "express";
import { prisma } from "../../app";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth";
import dayjs from "dayjs";
import { calculateDynamicPrice } from "../../utils/pricing";
import { checkRoomAvailability } from "../../utils/availability-checker";

const router = Router();

const idPattern = /^[A-Za-z0-9\-_]+$/;
const createBookingSchema = z.object({
  roomId: z.string().min(1).regex(idPattern, "Invalid room ID format"),
  propertyId: z.string().min(1).regex(idPattern, "Invalid property ID format"),
  checkInDate: z.string().datetime("Invalid check-in date"),
  checkOutDate: z.string().datetime("Invalid check-out date"),
  guests: z.number().int().min(1).default(1),
});

const getAuthUser = (req: any): { id: string } => {
  return (req as any).user;
};

const validateBookingDates = (checkIn: dayjs.Dayjs, checkOut: dayjs.Dayjs) => {
  const nights = checkOut.diff(checkIn, "day");

  if (nights <= 0) {
    throw new Error("Check-out date must be after check-in date");
  }

  if (checkIn.isBefore(dayjs().startOf("day"))) {
    throw new Error("Check-in date cannot be in the past");
  }

  return nights;
};

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const validation = createBookingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid data",
        errors: validation.error.issues,
      });
    }

    const user = getAuthUser(req);
    const data = validation.data;

    const checkIn = dayjs(data.checkInDate);
    const checkOut = dayjs(data.checkOutDate);

    try {
      validateBookingDates(checkIn, checkOut);
    } catch (dateError: any) {
      return res.status(400).json({ message: dateError.message });
    }

    const availabilityCheck = await checkRoomAvailability({
      roomId: data.roomId,
      checkInDate: checkIn.toDate(),
      checkOutDate: checkOut.toDate(),
    });

    if (!availabilityCheck.isAvailable) {
      return res.status(409).json({
        message: availabilityCheck.reason,
        unavailableDates: availabilityCheck.unavailableDates,
      });
    }

    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      select: { id: true, capacityGuests: true, basePrice: true },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (data.guests > room.capacityGuests) {
      return res.status(400).json({
        message: `Room capacity is ${room.capacityGuests} guests`,
      });
    }

    const pricing = await calculateDynamicPrice({
      roomId: data.roomId,
      checkInDate: checkIn.toDate(),
      checkOutDate: checkOut.toDate(),
    });

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        propertyId: data.propertyId,
        roomId: room.id,
        checkInDate: checkIn.toDate(),
        checkOutDate: checkOut.toDate(),
        guests: data.guests,
        nightlyPrice: pricing.averageNightlyPrice,
        totalPrice: pricing.totalPrice,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
      include: {
        property: { select: { id: true, name: true, city: true } },
        room: { select: { id: true, name: true, basePrice: true } },
      },
    });

    console.log(`✅ Booking created: ${booking.id} by user ${user.id}`);

    return res.status(201).json({
      booking,
      priceBreakdown: pricing,
    });
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    next(error);
  }
});

export default router;
