// Demo veri + demo (test) hesabi — ZARARSIZ ve idempotent.
//
// Mevcut prisma/seed.ts her seyi siler; bu script silmez. Var olan kayitlara
// dokunmadan, bos olan tablolara demo veri ekler ve bir demo WORKER hesabi
// olusturur (giris ekranindaki "Demo olarak gez" butonu bunu kullanir).
// Container'da tsx olmadigi icin duz "node" ile calisacak sekilde .mjs.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@ciftlik.com";
const DEMO_PASSWORD = "demo1234";

// n gun once bir tarih (sut verimi / son islemler icin).
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  // 1) Demo kullanici (WORKER) — varsa dokunma
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const demo = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      name: "Demo Kullanici",
      email: DEMO_EMAIL,
      password: passwordHash,
      role: "WORKER",
    },
  });

  // 2) Tarlalar (haritada guzel gorunmesi icin konumlu) + ekimler
  if ((await prisma.field.count()) === 0) {
    await prisma.field.create({
      data: {
        name: "Dere Tarlasi",
        area: 25.5,
        location: "Koy alti",
        posX: 80,
        posY: 90,
        crops: {
          create: [
            { name: "Bugday", plantedDate: new Date("2025-11-01"), status: "GROWING" },
          ],
        },
      },
    });
    await prisma.field.create({
      data: {
        name: "Tepe Tarlasi",
        area: 40,
        location: "Sirt",
        posX: 340,
        posY: 120,
        crops: {
          create: [
            { name: "Arpa", plantedDate: new Date("2026-02-15"), status: "PLANTED" },
          ],
        },
      },
    });
    await prisma.field.create({
      data: {
        name: "Cayir",
        area: 12,
        location: "Dere kenari",
        posX: 120,
        posY: 430,
        crops: {
          create: [
            { name: "Yonca", plantedDate: new Date("2025-09-10"), status: "HARVESTED" },
          ],
        },
      },
    });
  }

  // 3) Yapilar (ahir/kumes/depo) — konumlu
  if ((await prisma.structure.count()) === 0) {
    await prisma.structure.createMany({
      data: [
        { name: "Buyukbas Ahiri", type: "BARN", posX: 650, posY: 110, notes: "30 buyukbas kapasiteli" },
        { name: "Tavuk Kumesi", type: "COOP", posX: 700, posY: 340 },
        { name: "Yem Deposu", type: "STORAGE", posX: 430, posY: 440 },
      ],
    });
  }

  // 4) Hayvanlar (alt kayitlariyla)
  if ((await prisma.animal.count()) === 0) {
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
            { date: daysAgo(11), diagnosis: "Ayak enfeksiyonu", treatment: "Antibiyotik" },
          ],
        },
        vaccinations: {
          create: [
            { name: "Sap Asisi", date: new Date("2026-01-10"), nextDate: daysAgo(-40) },
          ],
        },
        milkYields: {
          create: [
            { date: daysAgo(2), amount: 13.5 },
            { date: daysAgo(1), amount: 12.5 },
            { date: daysAgo(0), amount: 14.0 },
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
    await prisma.animal.create({
      data: {
        tagNumber: "TR-003",
        name: "Boncuk",
        species: "GOAT",
        breed: "Saanen",
        gender: "FEMALE",
        birthDate: new Date("2023-06-01"),
        status: "ACTIVE",
      },
    });
  }

  // 5) Stok (biri kritik seviyede)
  if ((await prisma.inventoryItem.count()) === 0) {
    await prisma.inventoryItem.createMany({
      data: [
        { name: "Arpa", category: "FEED", quantity: 500, unit: "kg", criticalLevel: 100 },
        { name: "Antibiyotik", category: "MEDICINE", quantity: 5, unit: "adet", criticalLevel: 10 },
        { name: "Traktor yagi", category: "EQUIPMENT", quantity: 20, unit: "litre", criticalLevel: 5 },
      ],
    });
  }

  // 6) Finans (son aylara yayilmis — grafik icin)
  if ((await prisma.transaction.count()) === 0) {
    await prisma.transaction.createMany({
      data: [
        { type: "INCOME", amount: 5000, category: "Sut satisi", date: daysAgo(10) },
        { type: "EXPENSE", amount: 2000, category: "Yem alimi", date: daysAgo(8) },
        { type: "INCOME", amount: 3500, category: "Sut satisi", date: daysAgo(45) },
        { type: "EXPENSE", amount: 1200, category: "Ilac alimi", date: daysAgo(42) },
        { type: "INCOME", amount: 4200, category: "Hayvan satisi", date: daysAgo(75) },
      ],
    });
  }

  // 7) Gorevler (demo kullaniciya atali)
  if ((await prisma.task.count()) === 0) {
    await prisma.task.createMany({
      data: [
        { title: "Ahir temizligi", assignedToId: demo.id, status: "PENDING", dueDate: daysAgo(-2) },
        { title: "Yem siparisi ver", assignedToId: demo.id, status: "IN_PROGRESS", dueDate: daysAgo(-10) },
        { title: "Sut tankini kontrol et", assignedToId: demo.id, status: "DONE", dueDate: daysAgo(3) },
      ],
    });
  }

  console.log("Demo veri yuklendi.");
  console.log(`Demo giris: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Demo seed hatasi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
