import { Router } from "express";
import { prisma } from "../../app";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middlewares/auth";
import slugify from "slugify";

const router = Router();

const propertySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(1),
  categoryId: z.string().optional(),
  images: z.array(z.string()).default([]),
  facilityIds: z.array(z.string()).optional(),
});

router.post("/", requireAuth, requireRole("TENANT"), async (req, res, next) => {
  try {
    const p = propertySchema.safeParse(req.body);
    if (!p.success) {
      return res.status(400).json({ message: "Invalid data", errors: p.error });
    }

    const user = (req as any).user as { id: string };
    const tenant = await prisma.tenantProfile.findUnique({
      where: { userId: user.id },
    });

    if (!tenant) {
      return res.status(403).json({ message: "Tenant profile not found" });
    }

    const slug = slugify(p.data.name, { lower: true });
    const property = await prisma.property.create({
      data: {
        name: p.data.name,
        description: p.data.description,
        address: p.data.address,
        city: p.data.city,
        slug,
        tenantId: tenant.id,
        categoryId: p.data.categoryId,
        facilities:
          p.data.facilityIds && p.data.facilityIds.length
            ? { connect: p.data.facilityIds.map((id) => ({ id })) }
            : undefined,
      },
    });

    if (p.data.images.length) {
      await prisma.propertyImage.createMany({
        data: p.data.images.map((url) => ({ url, propertyId: property.id })),
      });
    }

    return res.json(property);
  } catch (error) {
    console.error("❌ Error creating property:", error);
    next(error);
  }
});

router.put(
  "/:id",
  requireAuth,
  requireRole("TENANT"),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const p = propertySchema.safeParse(req.body);
      if (!p.success) {
        return res.status(400).json({ message: "Invalid data" });
      }

      const updated = await prisma.property.update({
        where: { id },
        data: {
          name: p.data.name,
          description: p.data.description,
          address: p.data.address,
          city: p.data.city,
          categoryId: p.data.categoryId,
          slug: slugify(p.data.name, { lower: true }),
          facilities: p.data.facilityIds
            ? { set: p.data.facilityIds.map((fid) => ({ id: fid })) }
            : undefined,
        },
      });

      return res.json(updated);
    } catch (error) {
      console.error("❌ Error updating property:", error);
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
      const id = req.params.id;
      await prisma.property.delete({ where: { id } });
      return res.json({ message: "Property deleted" });
    } catch (error) {
      console.error("❌ Error deleting property:", error);
      next(error);
    }
  }
);

export default router;
