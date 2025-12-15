import { Router } from "express";
import { prisma } from "../app";
import { z } from "zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1, "Category name required"),
});

router.get("/", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return res.json(categories);
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    next(error);
  }
});

router.post("/", requireAuth, requireRole("TENANT"), async (req, res, next) => {
  try {
    const validation = categorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid data",
        errors: validation.error.issues,
      });
    }

    const category = await prisma.category.create({
      data: { name: validation.data.name },
    });

    console.log(`✅ Category created: ${category.id}`);
    return res.status(201).json(category);
  } catch (error) {
    console.error("❌ Error creating category:", error);
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
      const validation = categorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validation.error.issues,
        });
      }

      const category = await prisma.category.update({
        where: { id },
        data: { name: validation.data.name },
      });

      console.log(`✅ Category updated: ${id}`);
      return res.json(category);
    } catch (error) {
      console.error("❌ Error updating category:", error);
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
      await prisma.category.delete({ where: { id } });
      console.log(`✅ Category deleted: ${id}`);
      return res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting category:", error);
      next(error);
    }
  }
);

export default router;
