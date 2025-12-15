import { prisma } from "../app";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface PriceCalculationParams {
  roomId: string;
  checkInDate: Date;
  checkOutDate: Date;
}

interface DailyPrice {
  date: string;
  basePrice: number;
  seasonalAdjustment: number;
  finalPrice: number;
  type: "base" | "peak_season" | "custom";
}

interface PriceBreakdown {
  dailyPrices: DailyPrice[];
  totalPrice: number;
  averageNightlyPrice: number;
  nights: number;
}

export async function calculateDynamicPrice(
  params: PriceCalculationParams
): Promise<PriceBreakdown> {
  const { roomId, checkInDate, checkOutDate } = params;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      property: {
        include: {
          seasonRates: true,
        },
      },
      seasonRates: true,
      availabilities: {
        where: {
          date: {
            gte: checkInDate,
            lt: checkOutDate,
          },
        },
      },
    },
  });

  if (!room) {
    throw new Error("Room not found");
  }

  const basePrice = Number(room.basePrice);
  const dailyPrices: DailyPrice[] = [];

  let currentDate = dayjs(checkInDate);
  const endDate = dayjs(checkOutDate);

  while (currentDate.isBefore(endDate)) {
    let finalPrice = basePrice;
    let seasonalAdjustment = 0;
    let type: "base" | "peak_season" | "custom" = "base";

    const availability = room.availabilities.find(
      (a) =>
        dayjs(a.date).format("YYYY-MM-DD") === currentDate.format("YYYY-MM-DD")
    );

    if (availability?.overridePrice) {
      finalPrice = Number(availability.overridePrice);
      type = "custom";
    } else {
      const roomSeasonRate = room.seasonRates.find(
        (sr) =>
          currentDate.isSameOrAfter(dayjs(sr.startDate)) &&
          currentDate.isSameOrBefore(dayjs(sr.endDate))
      );

      if (roomSeasonRate) {
        type = "peak_season";
        if (roomSeasonRate.type === "NOMINAL") {
          finalPrice = Number(roomSeasonRate.value);
          seasonalAdjustment = Math.max(0, finalPrice - basePrice);
        } else {
          seasonalAdjustment = (basePrice * Number(roomSeasonRate.value)) / 100;
          finalPrice = basePrice + seasonalAdjustment;
        }
      } else {
        const propertySeasonRate = room.property.seasonRates.find(
          (sr) =>
            currentDate.isSameOrAfter(dayjs(sr.startDate)) &&
            currentDate.isSameOrBefore(dayjs(sr.endDate))
        );

        if (propertySeasonRate) {
          type = "peak_season";
          if (propertySeasonRate.type === "NOMINAL") {
            finalPrice = Number(propertySeasonRate.value);
            seasonalAdjustment = Math.max(0, finalPrice - basePrice);
          } else {
            seasonalAdjustment =
              (basePrice * Number(propertySeasonRate.value)) / 100;
            finalPrice = basePrice + seasonalAdjustment;
          }
        }
      }
    }

    dailyPrices.push({
      date: currentDate.format("YYYY-MM-DD"),
      basePrice,
      seasonalAdjustment,
      finalPrice: Math.round(finalPrice),
      type,
    });

    currentDate = currentDate.add(1, "day");
  }

  const totalPrice = dailyPrices.reduce((sum, day) => sum + day.finalPrice, 0);
  const nights = dailyPrices.length;
  const averageNightlyPrice = Math.round(totalPrice / nights);

  return {
    dailyPrices,
    totalPrice,
    averageNightlyPrice,
    nights,
  };
}
