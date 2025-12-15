import { Router } from "express";
import { prisma } from "../app";
import { z } from "zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

const facilitySchema = z.object({
  name: z.string().min(1, "Facility name required"),
});

router.get("/", async (req, res, next) => {
  try {
    const facilities = await prisma.facility.findMany({
      orderBy: { name: "asc" },
    });
    return res.json(facilities);
  } catch (error) {
    console.error("❌ Error fetching facilities:", error);
    next(error);
  }
});

router.post("/", requireAuth, requireRole("TENANT"), async (req, res, next) => {
  try {
    const validation = facilitySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid data",
        errors: validation.error.issues,
      });
    }

    const facility = await prisma.facility.create({
      data: { name: validation.data.name },
    });

    console.log(`✅ Facility created: ${facility.id}`);
    return res.status(201).json(facility);
  } catch (error) {
    console.error("❌ Error creating facility:", error);
    next(error);
  }
});

router.delete(
  "/:id",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.facility.delete({ where: { id } });
      console.log(`✅ Facility deleted: ${id}`);
      return res.json({ message: "Facility deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting facility:", error);
      next(error);
    }
  }
);

export default router;
