import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log("Admin user already exists. Skipping seed.");
    return;
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || `admin-${crypto.randomUUID().slice(0, 12)}`;
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@chinident.com",
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      role: "ADMIN",
    },
  });
  console.log(`Admin created: ${admin.email} / ${adminPassword}`);

  await prisma.globalSetting.createMany({
    data: [
      {
        key: "app.name",
        value: JSON.stringify("ChiniDent"),
        description: "Application name",
        updatedBy: admin.id,
      },
      {
        key: "app.default_theme",
        value: JSON.stringify("blue"),
        description: "Default CTA color theme",
        updatedBy: admin.id,
      },
      {
        key: "app.max_login_attempts",
        value: JSON.stringify(5),
        description: "Max failed login attempts before lockout",
        updatedBy: admin.id,
      },
      {
        key: "app.session_timeout",
        value: JSON.stringify(15),
        description: "Session timeout in minutes",
        updatedBy: admin.id,
      },
    ],
  });
  console.log("Global settings created.");

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
