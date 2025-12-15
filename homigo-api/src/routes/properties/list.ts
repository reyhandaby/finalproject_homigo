import { Router } from "express";
import { prisma } from "../../app";
import { z } from "zod";

const router = Router();

const listSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  city: z.string().optional(),
  sort: z.enum(["name", "price", "city"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(12),
  minPrice: z.coerce
    .number()
    .optional()
    .transform((val) => (val === 0 ? undefined : val)),
  maxPrice: z.coerce
    .number()
    .optional()
    .transform((val) => (val === 0 ? undefined : val)),
  facilityIds: z.string().optional(),
  facilityNames: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const p = listSchema.parse(req.query);

    const where: any = {};
    if (p.q) where.name = { contains: p.q, mode: "insensitive" };
    if (p.categoryId) where.categoryId = p.categoryId;
    if (p.city) where.city = { contains: p.city, mode: "insensitive" };

    let facilityIds = p.facilityIds?.split(",").filter(Boolean) || [];
    if (!facilityIds.length && p.facilityNames) {
      const names = p.facilityNames.split(",").filter(Boolean);
      if (names.length) {
        const fac = await prisma.facility.findMany({
          where: { name: { in: names } },
          select: { id: true },
        });
        facilityIds = fac.map((f) => f.id);
      }
    }
    if (facilityIds.length) {
      where.facilities = { some: { id: { in: facilityIds } } };
    }

    const allProperties = await prisma.property.findMany({
      where,
      include: {
        rooms: {
          select: { id: true, basePrice: true },
          orderBy: { basePrice: "asc" },
        },
        images: { take: 3, orderBy: { createdAt: "asc" } },
        category: true,
        facilities: true,
      },
      orderBy:
        p.sort === "name"
          ? { name: p.order }
          : p.sort === "city"
          ? { city: p.order }
          : { createdAt: "desc" },
    });

    let propertiesWithPrice = allProperties.map((prop) => {
      const prices = prop.rooms.map((r) => Number(r.basePrice));
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      return { ...prop, minPrice };
    });

    console.log(
      `💰 [BACKEND] After price calculation: ${propertiesWithPrice.length} items`
    );

    if (p.minPrice !== undefined) {
      const before = propertiesWithPrice.length;
      propertiesWithPrice = propertiesWithPrice.filter(
        (item) => item.minPrice >= p.minPrice!
      );
      console.log(
        `🔽 [BACKEND] After minPrice filter (${p.minPrice}): ${before} → ${propertiesWithPrice.length}`
      );
    }

    if (p.maxPrice !== undefined) {
      const before = propertiesWithPrice.length;
      propertiesWithPrice = propertiesWithPrice.filter(
        (item) => item.minPrice <= p.maxPrice!
      );
      console.log(
        `🔼 [BACKEND] After maxPrice filter (${p.maxPrice}): ${before} → ${propertiesWithPrice.length}`
      );
    }

    if (p.sort === "price") {
      propertiesWithPrice.sort((a, b) =>
        p.order === "asc" ? a.minPrice - b.minPrice : b.minPrice - a.minPrice
      );
    }

    const total = propertiesWithPrice.length;
    const start = (p.page - 1) * p.pageSize;
    const end = start + p.pageSize;
    const paged = propertiesWithPrice.slice(start, end);

    console.log(
      `📄 [BACKEND] Pagination: page ${p.page}, showing ${start}-${end} of ${total}`
    );
    console.log(`✅ [BACKEND] Returning ${paged.length} items`);

    return res.json({
      items: paged,
      total: total,
      page: p.page,
      pageSize: p.pageSize,
    });
  } catch (error) {
    console.error("❌ [BACKEND] Error fetching properties:", error);
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const prop = await prisma.property.findUnique({
      where: { id },
      include: {
        images: true,
        rooms: {
          include: {
            images: true,
            availabilities: true,
            seasonRates: true,
          },
        },
        seasonRates: true,
        facilities: true,
        category: true,
      },
    });

    if (!prop) {
      return res.status(404).json({ message: "Property not found" });
    }

    return res.json(prop);
  } catch (error) {
    console.error("❌ Error fetching property:", error);
    next(error);
  }
});



export default router;
