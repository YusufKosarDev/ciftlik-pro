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

  // Cok-kiracilik: tum seed verisi tek bir varsayilan tenant'a baglanir.
  // (Backfill migration ile ayni sabit id.)
  const TENANT_ID = "default-tenant";
  // Demo/showcase tenant PRO'dur (sinirsiz); boylece ana demo limit'e takilmaz.
  // Yeni kayitlar (public signup) FREE baslar ve limitleri dogal gosterir.
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: { plan: "PRO" },
    create: { id: TENANT_ID, name: "Varsayilan Ciftlik", slug: "default", plan: "PRO" },
  });

  // Kullanicilar (seed kullanicilari "mevcut" sayilir; hos geldin turunu
  // gormus kabul edilir -> onboardedAt dolu)
  // Maliyet 12: src/lib/password-hash.ts BCRYPT_COST ile ayni.
  const passwordHash = await bcrypt.hash("sifre1234", 12);
  const now = new Date();
  const admin = await prisma.user.create({
    data: {
      tenantId: TENANT_ID,
      name: "Yonetici",
      email: "admin@ciftlik.com",
      password: passwordHash,
      role: "ADMIN",
      onboardedAt: now,
    },
  });
  const worker = await prisma.user.create({
    data: {
      tenantId: TENANT_ID,
      name: "Ahmet Calisan",
      email: "ahmet@ciftlik.com",
      password: passwordHash,
      role: "WORKER",
      onboardedAt: now,
    },
  });
  await prisma.user.create({
    data: {
      tenantId: TENANT_ID,
      name: "Veteriner Veli",
      email: "vet@ciftlik.com",
      password: passwordHash,
      role: "VET",
      onboardedAt: now,
    },
  });

  // Hayvanlar (alt kayitlariyla). Ic ice kayitlar tenantId'yi otomatik
  // devralmadigindan her alt kayda da acikca yaziyoruz.
  await prisma.animal.create({
    data: {
      tenantId: TENANT_ID,
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
            tenantId: TENANT_ID,
            date: new Date("2026-05-20"),
            diagnosis: "Ayak enfeksiyonu",
            treatment: "Antibiyotik",
          },
        ],
      },
      vaccinations: {
        create: [
          {
            tenantId: TENANT_ID,
            name: "Sap Asisi",
            date: new Date("2026-01-10"),
            nextDate: new Date("2026-07-10"),
          },
        ],
      },
      milkYields: {
        create: [
          { tenantId: TENANT_ID, date: new Date("2026-05-28"), amount: 13.5 },
          { tenantId: TENANT_ID, date: new Date("2026-05-29"), amount: 12.5 },
          { tenantId: TENANT_ID, date: new Date("2026-05-30"), amount: 14.0 },
        ],
      },
    },
  });
  await prisma.animal.create({
    data: {
      tenantId: TENANT_ID,
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
      tenantId: TENANT_ID,
      name: "Dere Tarlasi",
      area: 25.5,
      location: "Koy alti",
      crops: {
        create: [
          {
            tenantId: TENANT_ID,
            name: "Bugday",
            plantedDate: new Date("2025-11-01"),
            status: "GROWING",
          },
        ],
      },
    },
  });
  await prisma.field.create({
    data: { tenantId: TENANT_ID, name: "Tepe Tarlasi", area: 40, location: "Sirt" },
  });

  // Stok (biri kritik seviyede)
  await prisma.inventoryItem.createMany({
    data: [
      { tenantId: TENANT_ID, name: "Arpa", category: "FEED", quantity: 500, unit: "kg", criticalLevel: 100 },
      { tenantId: TENANT_ID, name: "Antibiyotik", category: "MEDICINE", quantity: 5, unit: "adet", criticalLevel: 10 },
      { tenantId: TENANT_ID, name: "Traktor yagi", category: "EQUIPMENT", quantity: 20, unit: "litre", criticalLevel: 5 },
    ],
  });

  // Finans (son aylara yayilmis)
  await prisma.transaction.createMany({
    data: [
      { tenantId: TENANT_ID, type: "INCOME", amount: 5000, category: "Sut satisi", date: new Date("2026-05-20") },
      { tenantId: TENANT_ID, type: "EXPENSE", amount: 2000, category: "Yem alimi", date: new Date("2026-05-22") },
      { tenantId: TENANT_ID, type: "INCOME", amount: 3500, category: "Sut satisi", date: new Date("2026-04-15") },
      { tenantId: TENANT_ID, type: "EXPENSE", amount: 1200, category: "Ilac alimi", date: new Date("2026-04-18") },
    ],
  });

  // Gorevler
  await prisma.task.createMany({
    data: [
      {
        tenantId: TENANT_ID,
        title: "Ahir temizligi",
        assignedToId: worker.id,
        status: "PENDING",
        dueDate: new Date("2026-05-25"),
      },
      {
        tenantId: TENANT_ID,
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
