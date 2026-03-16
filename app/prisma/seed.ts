import "dotenv/config";
// Railway uses self-signed certs — disable TLS verification for the adapter
if (process.env.DATABASE_URL?.includes("railway")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create Master Admin user (upsert resets password if it already exists)
  const adminPassword = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@scholarsuite.com" },
    update: {
      password: adminPassword,
      isMasterAdmin: true,
    },
    create: {
      email: "admin@scholarsuite.com",
      name: "Dr. Sarah Mitchell",
      password: adminPassword,
      role: "ADMIN",
      isMasterAdmin: true,
    },
  });

  console.log("Seed complete!");
  console.log("Master Admin credentials:");
  console.log("  Email:    admin@scholarsuite.com");
  console.log("  Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
