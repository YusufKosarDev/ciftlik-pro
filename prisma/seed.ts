import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Mevcut veriyi temizle (yabanci anahtar sirasina dikkat: once cocuklar)
  await prisma.healthRecord.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.milkYield.deleteMany();
  await prisma.crop.deleteMany();
  await prisma.task.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.field.deleteMany();
  await prisma.user.deleteMany();

  // Kullanicilar (seed kullanicilari "mevcut" sayilir; hos geldin turunu
  // gormus kabul edilir -> onboardedAt dolu)
  const passwordHash = await bcrypt.hash("sifre1234", 10);
  const now = new Date();
  const admin = await prisma.user.create({
    data: {
      name: "Yonetici",
      email: "admin@ciftlik.com",
      password: passwordHash,
      role: "ADMIN",
      onboardedAt: now,
    },
  });
  const worker = await prisma.user.create({
    data: {
      name: "Ahmet Calisan",
      email: "ahmet@ciftlik.com",
      password: passwordHash,
      role: "WORKER",
      onboardedAt: now,
    },
  });
  await prisma.user.create({
    data: {
      name: "Veteriner Veli",
      email: "vet@ciftlik.com",
      password: passwordHash,
      role: "VET",
      onboardedAt: now,
    },
  });

  // Hayvanlar (alt kayitlariyla)
  await prisma.animal.create({
    data: {
      tagNumber: "TR-001",
      name: "Sarikiz",
      species: "CATTLE",
      breed: "Holstein",
      gender: "FEMALE",
      birthDate: new Date("2022-04-10"),
      status: "ACTIVE",
      healthRecords: {
        create: [
          {
            date: new Date("2026-05-20"),
            diagnosis: "Ayak enfeksiyonu",
            treatment: "Antibiyotik",
          },
        ],
      },
      vaccinations: {
        create: [
          {
            name: "Sap Asisi",
            date: new Date("2026-01-10"),
            nextDate: new Date("2026-07-10"),
          },
        ],
      },
      milkYields: {
        create: [
          { date: new Date("2026-05-28"), amount: 13.5 },
          { date: new Date("2026-05-29"), amount: 12.5 },
          { date: new Date("2026-05-30"), amount: 14.0 },
        ],
      },
    },
  });
  await prisma.animal.create({
    data: {
      tagNumber: "TR-002",
      name: "Pamuk",
      species: "SHEEP",
      breed: "Merinos",
      gender: "FEMALE",
      birthDate: new Date("2023-03-15"),
      status: "ACTIVE",
    },
  });

  // Tarlalar (ekimleriyle)
  await prisma.field.create({
    data: {
      name: "Dere Tarlasi",
      area: 25.5,
      location: "Koy alti",
      crops: {
        create: [
          {
            name: "Bugday",
            plantedDate: new Date("2025-11-01"),
            status: "GROWING",
          },
        ],
      },
    },
  });
  await prisma.field.create({
    data: { name: "Tepe Tarlasi", area: 40, location: "Sirt" },
  });

  // Stok (biri kritik seviyede)
  await prisma.inventoryItem.createMany({
    data: [
      { name: "Arpa", category: "FEED", quantity: 500, unit: "kg", criticalLevel: 100 },
      { name: "Antibiyotik", category: "MEDICINE", quantity: 5, unit: "adet", criticalLevel: 10 },
      { name: "Traktor yagi", category: "EQUIPMENT", quantity: 20, unit: "litre", criticalLevel: 5 },
    ],
  });

  // Finans (son aylara yayilmis)
  await prisma.transaction.createMany({
    data: [
      { type: "INCOME", amount: 5000, category: "Sut satisi", date: new Date("2026-05-20") },
      { type: "EXPENSE", amount: 2000, category: "Yem alimi", date: new Date("2026-05-22") },
      { type: "INCOME", amount: 3500, category: "Sut satisi", date: new Date("2026-04-15") },
      { type: "EXPENSE", amount: 1200, category: "Ilac alimi", date: new Date("2026-04-18") },
    ],
  });

  // Gorevler
  await prisma.task.createMany({
    data: [
      {
        title: "Ahir temizligi",
        assignedToId: worker.id,
        status: "PENDING",
        dueDate: new Date("2026-05-25"),
      },
      {
        title: "Yem siparisi ver",
        assignedToId: admin.id,
        status: "IN_PROGRESS",
        dueDate: new Date("2026-06-10"),
      },
    ],
  });

  console.log("Seed tamamlandi.");
  console.log("Giris: admin@ciftlik.com / sifre1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
