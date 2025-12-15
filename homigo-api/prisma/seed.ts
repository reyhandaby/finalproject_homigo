import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  console.error("❌ DATABASE_URL is not defined in .env file");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function main() {
  console.log("🌱 Starting seed...");
  console.log("📡 Connecting to database...");
  console.log(`🔗 Database URL: ${connectionString.substring(0, 50)}...`);

  try {
    await prisma.$connect();
    console.log("✅ Database connected");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    throw error;
  }

  console.log("🗑️  Cleaning database...");
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.paymentProof.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.roomAvailability.deleteMany();
  await prisma.seasonRate.deleteMany();
  await prisma.roomImage.deleteMany();
  await prisma.room.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.tenantProfile.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.facility.deleteMany();
  console.log("✅ Database cleaned");

  console.log("📁 Creating categories...");
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Hotel" } }),
    prisma.category.create({ data: { name: "Villa" } }),
    prisma.category.create({ data: { name: "Apartment" } }),
    prisma.category.create({ data: { name: "Guesthouse" } }),
    prisma.category.create({ data: { name: "Resort" } }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  console.log("🏊 Creating facilities...");
  const facilities = await Promise.all([
    prisma.facility.create({ data: { name: "WiFi" } }),
    prisma.facility.create({ data: { name: "Swimming Pool" } }),
    prisma.facility.create({ data: { name: "Parking" } }),
    prisma.facility.create({ data: { name: "Restaurant" } }),
    prisma.facility.create({ data: { name: "Gym" } }),
    prisma.facility.create({ data: { name: "Air Conditioning" } }),
    prisma.facility.create({ data: { name: "Room Service" } }),
  ]);
  console.log(`✅ Created ${facilities.length} facilities`);

  console.log("👤 Creating users...");
  const passwordHash = await bcrypt.hash("password123", 10);

  const regularUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: "john.doe@example.com",
        name: "John Doe",
        role: "USER",
        isVerified: true,
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: "jane.smith@example.com",
        name: "Jane Smith",
        role: "USER",
        isVerified: true,
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: "bob.wilson@example.com",
        name: "Bob Wilson",
        role: "USER",
        isVerified: true,
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: "alice.brown@example.com",
        name: "Alice Brown",
        role: "USER",
        isVerified: true,
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: "charlie.davis@example.com",
        name: "Charlie Davis",
        role: "USER",
        isVerified: false,
        passwordHash,
      },
    }),
  ]);

  const tenantUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: "tenant1@homigo.com",
        name: "Grand Hotel Owner",
        role: "TENANT",
        isVerified: true,
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: "tenant2@homigo.com",
        name: "Villa Paradise Owner",
        role: "TENANT",
        isVerified: true,
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: "tenant3@homigo.com",
        name: "City Apartments Owner",
        role: "TENANT",
        isVerified: true,
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: "tenant4@homigo.com",
        name: "Beach Resort Owner",
        role: "TENANT",
        isVerified: true,
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: "tenant5@homigo.com",
        name: "Mountain Lodge Owner",
        role: "TENANT",
        isVerified: true,
        passwordHash,
      },
    }),
  ]);
  console.log(`✅ Created ${regularUsers.length + tenantUsers.length} users`);

  console.log("🏢 Creating tenant profiles...");
  const tenantProfiles = await Promise.all([
    prisma.tenantProfile.create({
      data: {
        userId: tenantUsers[0].id,
        company: "Grand Hotel Group",
        phone: "+62812345678901",
        address: "Jl. Sudirman No. 1, Jakarta",
      },
    }),
    prisma.tenantProfile.create({
      data: {
        userId: tenantUsers[1].id,
        company: "Villa Paradise Ltd",
        phone: "+62812345678902",
        address: "Jl. Raya Ubud, Bali",
      },
    }),
    prisma.tenantProfile.create({
      data: {
        userId: tenantUsers[2].id,
        company: "City Living Apartments",
        phone: "+62812345678903",
        address: "Jl. Gatot Subroto, Bandung",
      },
    }),
    prisma.tenantProfile.create({
      data: {
        userId: tenantUsers[3].id,
        company: "Tropical Beach Resorts",
        phone: "+62812345678904",
        address: "Jl. Pantai Kuta, Bali",
      },
    }),
    prisma.tenantProfile.create({
      data: {
        userId: tenantUsers[4].id,
        company: "Highland Lodges Inc",
        phone: "+62812345678905",
        address: "Jl. Raya Puncak, Bogor",
      },
    }),
  ]);
  console.log(`✅ Created ${tenantProfiles.length} tenant profiles`);

  console.log("🏨 Creating properties...");
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        name: "Grand Luxury Hotel Jakarta",
        slug: "grand-luxury-hotel-jakarta",
        description:
          "5-star luxury hotel in the heart of Jakarta with world-class amenities",
        address: "Jl. Sudirman No. 1",
        city: "Jakarta",
        latitude: -6.2088,
        longitude: 106.8456,
        tenantId: tenantProfiles[0].id,
        categoryId: categories[0].id,
        facilities: {
          connect: [
            { id: facilities[0].id },
            { id: facilities[1].id },
            { id: facilities[3].id },
            { id: facilities[4].id },
          ],
        },
      },
    }),
    prisma.property.create({
      data: {
        name: "Paradise Villa Ubud",
        slug: "paradise-villa-ubud",
        description:
          "Stunning private villa with rice field views and infinity pool",
        address: "Jl. Raya Ubud No. 45",
        city: "Bali",
        latitude: -8.5069,
        longitude: 115.2625,
        tenantId: tenantProfiles[1].id,
        categoryId: categories[1].id,
        facilities: {
          connect: [
            { id: facilities[0].id },
            { id: facilities[1].id },
            { id: facilities[5].id },
          ],
        },
      },
    }),
    prisma.property.create({
      data: {
        name: "Modern Studio Apartment Bandung",
        slug: "modern-studio-apartment-bandung",
        description: "Cozy studio apartments perfect for business travelers",
        address: "Jl. Gatot Subroto No. 88",
        city: "Bandung",
        latitude: -6.9175,
        longitude: 107.6191,
        tenantId: tenantProfiles[2].id,
        categoryId: categories[2].id,
        facilities: {
          connect: [
            { id: facilities[0].id },
            { id: facilities[2].id },
            { id: facilities[5].id },
          ],
        },
      },
    }),
    prisma.property.create({
      data: {
        name: "Beachfront Resort Kuta",
        slug: "beachfront-resort-kuta",
        description: "Luxurious beachfront resort with direct beach access",
        address: "Jl. Pantai Kuta No. 99",
        city: "Bali",
        latitude: -8.7183,
        longitude: 115.1686,
        tenantId: tenantProfiles[3].id,
        categoryId: categories[4].id,
        facilities: { connect: facilities.map((f) => ({ id: f.id })) },
      },
    }),
    prisma.property.create({
      data: {
        name: "Mountain View Lodge Puncak",
        slug: "mountain-view-lodge-puncak",
        description: "Peaceful mountain retreat with stunning views",
        address: "Jl. Raya Puncak KM 87",
        city: "Bogor",
        latitude: -6.7024,
        longitude: 106.9447,
        tenantId: tenantProfiles[4].id,
        categoryId: categories[3].id,
        facilities: {
          connect: [
            { id: facilities[0].id },
            { id: facilities[2].id },
            { id: facilities[3].id },
          ],
        },
      },
    }),
  ]);
  console.log(`✅ Created ${properties.length} properties`);

  console.log("📷 Creating property images...");
  const propertyImages = [];
  for (const property of properties) {
    for (let i = 1; i <= 3; i++) {
      propertyImages.push(
        await prisma.propertyImage.create({
          data: {
            propertyId: property.id,
            url: `https://images.unsplash.com/photo-${
              1566073000000 + Math.floor(Math.random() * 10000000)
            }?w=800`,
          },
        })
      );
    }
  }
  console.log(`✅ Created ${propertyImages.length} property images`);

  console.log("🛏️  Creating rooms...");
  const rooms = [];
  const roomTypes = [
    { name: "Deluxe Room", price: 500000, guests: 2, beds: 1, baths: 1 },
    { name: "Superior Suite", price: 850000, guests: 3, beds: 1, baths: 1 },
    { name: "Family Room", price: 1200000, guests: 4, beds: 2, baths: 2 },
  ];

  for (const property of properties) {
    for (const roomType of roomTypes) {
      rooms.push(
        await prisma.room.create({
          data: {
            propertyId: property.id,
            name: roomType.name,
            description: `Comfortable ${roomType.name.toLowerCase()} with modern amenities`,
            basePrice: roomType.price,
            capacityGuests: roomType.guests,
            beds: roomType.beds,
            baths: roomType.baths,
          },
        })
      );
    }
  }
  console.log(`✅ Created ${rooms.length} rooms`);

  console.log("📷 Creating room images...");
  const roomImages = [];
  for (const room of rooms) {
    for (let i = 1; i <= 2; i++) {
      roomImages.push(
        await prisma.roomImage.create({
          data: {
            roomId: room.id,
            url: `https://images.unsplash.com/photo-${
              1580000000000 + Math.floor(Math.random() * 10000000)
            }?w=600`,
          },
        })
      );
    }
  }
  console.log(`✅ Created ${roomImages.length} room images`);

  console.log("📅 Creating bookings...");
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        userId: regularUsers[0].id,
        propertyId: properties[0].id,
        roomId: rooms[0].id,
        checkInDate: new Date("2025-12-20"),
        checkOutDate: new Date("2025-12-23"),
        guests: 2,
        nightlyPrice: 500000,
        totalPrice: 1500000,
        status: "CONFIRMED",
        paymentStatus: "APPROVED",
      },
    }),
    prisma.booking.create({
      data: {
        userId: regularUsers[1].id,
        propertyId: properties[1].id,
        roomId: rooms[3].id,
        checkInDate: new Date("2025-12-25"),
        checkOutDate: new Date("2025-12-30"),
        guests: 3,
        nightlyPrice: 850000,
        totalPrice: 4250000,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
    }),
    prisma.booking.create({
      data: {
        userId: regularUsers[2].id,
        propertyId: properties[2].id,
        roomId: rooms[6].id,
        checkInDate: new Date("2025-12-15"),
        checkOutDate: new Date("2025-12-18"),
        guests: 2,
        nightlyPrice: 350000,
        totalPrice: 1050000,
        status: "CONFIRMED",
        paymentStatus: "APPROVED",
      },
    }),
    prisma.booking.create({
      data: {
        userId: regularUsers[3].id,
        propertyId: properties[3].id,
        roomId: rooms[9].id,
        checkInDate: new Date("2026-01-05"),
        checkOutDate: new Date("2026-01-10"),
        guests: 4,
        nightlyPrice: 1200000,
        totalPrice: 6000000,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
    }),
    prisma.booking.create({
      data: {
        userId: regularUsers[0].id,
        propertyId: properties[4].id,
        roomId: rooms[12].id,
        checkInDate: new Date("2025-12-28"),
        checkOutDate: new Date("2026-01-02"),
        guests: 2,
        nightlyPrice: 850000,
        totalPrice: 4250000,
        status: "CANCELLED",
        paymentStatus: "REJECTED",
      },
    }),
  ]);
  console.log(`✅ Created ${bookings.length} bookings`);

  console.log("⭐ Creating reviews...");
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        bookingId: bookings[0].id,
        userId: regularUsers[0].id,
        rating: 5,
        comment:
          "Excellent hotel! Staff was very friendly and the room was spotless.",
        reply: "Thank you for your wonderful review!",
        repliedAt: new Date(),
      },
    }),
    prisma.review.create({
      data: {
        bookingId: bookings[2].id,
        userId: regularUsers[2].id,
        rating: 4,
        comment: "Good location and comfortable room. Would recommend!",
      },
    }),
  ]);
  console.log(`✅ Created ${reviews.length} reviews`);

  console.log("💳 Creating transactions...");
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        bookingId: bookings[0].id,
        amount: 1500000,
        paidAt: new Date("2025-12-10"),
      },
    }),
    prisma.transaction.create({
      data: {
        bookingId: bookings[2].id,
        amount: 1050000,
        paidAt: new Date("2025-12-08"),
      },
    }),
  ]);
  console.log(`✅ Created ${transactions.length} transactions`);

  console.log("\n✨ Seed completed successfully!");
  console.log(`📊 Summary:`);
  console.log(`   - ${categories.length} categories`);
  console.log(`   - ${facilities.length} facilities`);
  console.log(`   - ${regularUsers.length + tenantUsers.length} users`);
  console.log(`   - ${tenantProfiles.length} tenant profiles`);
  console.log(`   - ${properties.length} properties`);
  console.log(`   - ${rooms.length} rooms`);
  console.log(`   - ${bookings.length} bookings`);
  console.log(`   - ${reviews.length} reviews`);
  console.log(`   - ${transactions.length} transactions`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
