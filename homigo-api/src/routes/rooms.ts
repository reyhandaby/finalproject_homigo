import { Router } from "express";
import { prisma } from "../app";
import { z } from "zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

const roomSchema = z.object({
  name: z.string().min(1, "Room name required"),
  description: z.string().optional(),
  basePrice: z.number().positive("Price must be positive"),
  capacityGuests: z.number().int().min(1, "At least 1 guest capacity"),
  beds: z.number().int().min(0).default(1),
  baths: z.number().int().min(0).default(1),
});

router.get("/property/:propertyId", async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const rooms = await prisma.room.findMany({
      where: { propertyId },
      include: {
        images: true,
        availabilities: {
          where: { date: { gte: new Date() } },
          orderBy: { date: "asc" },
        },
        seasonRates: {
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
      },
      orderBy: { basePrice: "asc" },
    });

    console.log(`✅ Fetched ${rooms.length} rooms for property ${propertyId}`);
    return res.json(rooms);
  } catch (error) {
    console.error("❌ Error fetching rooms:", error);
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        images: true,
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
          },
        },
        availabilities: true,
        seasonRates: true,
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    return res.json(room);
  } catch (error) {
    console.error("❌ Error fetching room:", error);
    next(error);
  }
});

router.post("/tenant/properties/:propertyId/rooms", requireAuth, requireRole("TENANT"), async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const validation = roomSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Invalid data", errors: validation.error.issues });
    }

    const data = validation.data;
    const user = (req as any).user as { id: string };

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { tenant: true },
    });

    if (!property || property.tenant.userId !== user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const room = await prisma.room.create({
      data: { ...data, propertyId },
      include: { images: true },
    });

    return res.status(201).json(room);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const validation = roomSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validation.error.issues,
        });
      }

      const data = validation.data;
      const room = await prisma.room.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          basePrice: data.basePrice,
          capacityGuests: data.capacityGuests,
          beds: data.beds,
          baths: data.baths,
        },
      });

      console.log(`✅ Room updated: ${id}`);
      return res.json(room);
    } catch (error) {
      console.error("❌ Error updating room:", error);
      next(error);
    }
  }
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.room.delete({ where: { id } });
      console.log(`✅ Room deleted: ${id}`);
      return res.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting room:", error);
      next(error);
    }
  }
);

router.post(
  "/:id/images",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const schema = z.object({ base64: z.string().min(1) });
      const validation = schema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data" });
      }

      const { uploadImage } = await import("../utils/cloudinary");
      const url = await uploadImage(validation.data.base64);

      const image = await prisma.roomImage.create({
        data: { roomId: id, url },
      });

      console.log(`✅ Room image uploaded: ${image.id}`);
      return res.json(image);
    } catch (error) {
      console.error("❌ Error uploading room image:", error);
      next(error);
    }
  }
);

router.delete(
  "/images/:imageId",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const { imageId } = req.params;
      await prisma.roomImage.delete({ where: { id: imageId } });
      console.log(`✅ Room image deleted: ${imageId}`);
      return res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting room image:", error);
      next(error);
    }
  }
);

export default router;
