import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withTenant, type TenantDb } from "@/lib/tenant-prisma";
import { hashPassword } from "@/lib/password-hash";
import {
  DEMO_ACCOUNTS,
  DEMO_EMAIL,
  DEMO_EMAILS,
  DEMO_PASSWORD,
} from "@/lib/demo-accounts";

// The showcase (demo) tenant's data — SINGLE SOURCE.
//
// Called from three places:
//   1. `npm run db:seed-demo`      (local development)
//   2. The production build        (vercel.json buildCommand)
//   3. The nightly cron            (/api/cron/demo-reset, reset: true)
//
// VERSIONING: DEMO_DATA_VERSION in the code is compared against
// SeedState("demoDataVersion") in the database. If they differ the demo tenant is
// wiped and repopulated; if they match nothing happens. That keeps the demo data
// current by repairing itself, with no manual intervention.
//
// RLS: Tenant and SeedState are outside RLS (plain `prisma`). Everything else is
// tenant-scoped and runs inside `withTenant` — in production the application
// connects as a non-superuser role, so with no context NOT ONE row is visible.

export const TENANT_ID = "default-tenant";
export const TENANT_SLUG = "default";
export const TENANT_NAME = "Yeşilvadi Çiftliği";
export { DEMO_EMAIL, DEMO_PASSWORD };

// The showcase accounts are defined in src/lib/demo-accounts.ts (SINGLE SOURCE)
// and only re-exported here: prisma/seed-demo.ts imports the two constants from
// this module.
export { DEMO_ACCOUNTS, DEMO_EMAILS };

// Compile-time check: demo-accounts.ts keeps the roles as a plain union so it can
// stay dependency-free. Prisma is already imported here, so the match is verified
// at this point — if a role name drifts from the Prisma enum, the build stops
// here.
const _demoRolesMatchPrisma: ReadonlyArray<{ role: Role }> = DEMO_ACCOUNTS;
void _demoRolesMatchPrisma;

// Demo data version. INCREMENT it whenever the content changes; the demo tenant
// is then rebuilt automatically on the next deploy or cron run.
// 3 -> 4: one showcase account per role instead of a single ADMIN.
export const DEMO_DATA_VERSION = "4";

const SEED_STATE_KEY = "demoDataVersion";

// The seed does bulk writes and runs over a pooled (Neon/pgbouncer) connection in
// production; Prisma's default 5s interactive-transaction timeout can be too tight
// for that. It is raised for this path only.
const SEED_TX = { timeout: 30_000, maxWait: 10_000 } as const;

function seedTx<T>(fn: (db: TenantDb) => Promise<T>): Promise<T> {
  return withTenant(TENANT_ID, fn, SEED_TX);
}

// --- Date helpers -----------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}

function daysAhead(n: number): Date {
  return new Date(Date.now() + n * DAY_MS);
}

// n months ago, on the given day of the month (so the monthly finance chart fills
// in cleanly).
function monthsAgo(n: number, day = 15): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return d;
}

// Deterministic pseudo-random (mulberry32). It runs from a fixed seed so the same
// version produces the same data, which also keeps the screenshots stable.
function makeRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

// --- Fixed content ----------------------------------------------------------

type AnimalSeed = {
  tag: string;
  name: string;
  species: "CATTLE" | "SHEEP" | "GOAT" | "CHICKEN" | "OTHER";
  breed: string;
  gender: "FEMALE" | "MALE";
  birthYear: number;
  birthMonth: number;
  status: "ACTIVE" | "SOLD" | "DECEASED";
  // Milking cows: the daily milk yield chart is generated for these.
  milkBase?: number;
  // The growth chart is generated for these (kg).
  weightBase?: number;
  motherTag?: string;
};

const ANIMALS: AnimalSeed[] = [
  // Milking cows (milk yield charts)
  { tag: "TR-1001", name: "Sarıkız", species: "CATTLE", breed: "Holstein", gender: "FEMALE", birthYear: 2021, birthMonth: 3, status: "ACTIVE", milkBase: 27, weightBase: 620 },
  { tag: "TR-1002", name: "Karagöz", species: "CATTLE", breed: "Simental", gender: "FEMALE", birthYear: 2020, birthMonth: 7, status: "ACTIVE", milkBase: 23, weightBase: 655 },
  { tag: "TR-1003", name: "Benekli", species: "CATTLE", breed: "Holstein", gender: "FEMALE", birthYear: 2022, birthMonth: 1, status: "ACTIVE", milkBase: 25, weightBase: 590 },
  { tag: "TR-1004", name: "Gelincik", species: "CATTLE", breed: "Jersey", gender: "FEMALE", birthYear: 2021, birthMonth: 11, status: "ACTIVE", milkBase: 19, weightBase: 480 },
  { tag: "TR-1005", name: "Menekşe", species: "CATTLE", breed: "Simental", gender: "FEMALE", birthYear: 2019, birthMonth: 4, status: "ACTIVE", milkBase: 21, weightBase: 670 },
  { tag: "TR-1006", name: "Zeytin", species: "CATTLE", breed: "Holstein", gender: "FEMALE", birthYear: 2022, birthMonth: 9, status: "ACTIVE", milkBase: 24, weightBase: 545 },
  // Breeding bull + fattening calves (weight tracking)
  { tag: "TR-1007", name: "Boğaç", species: "CATTLE", breed: "Simental", gender: "MALE", birthYear: 2020, birthMonth: 2, status: "ACTIVE", weightBase: 880 },
  { tag: "TR-1008", name: "Kömür", species: "CATTLE", breed: "Angus", gender: "MALE", birthYear: 2024, birthMonth: 3, status: "ACTIVE", weightBase: 340 },
  { tag: "TR-1009", name: "Fındık", species: "CATTLE", breed: "Angus", gender: "MALE", birthYear: 2024, birthMonth: 5, status: "ACTIVE", weightBase: 305 },
  // Offspring (lineage: the mother's ear tag)
  { tag: "TR-1010", name: "Pamuk", species: "CATTLE", breed: "Holstein", gender: "FEMALE", birthYear: 2025, birthMonth: 10, status: "ACTIVE", weightBase: 145, motherTag: "TR-1001" },
  { tag: "TR-1011", name: "Duman", species: "CATTLE", breed: "Simental", gender: "MALE", birthYear: 2025, birthMonth: 12, status: "ACTIVE", weightBase: 120, motherTag: "TR-1002" },
  { tag: "TR-1012", name: "Yıldız", species: "CATTLE", breed: "Holstein", gender: "FEMALE", birthYear: 2026, birthMonth: 2, status: "ACTIVE", weightBase: 95, motherTag: "TR-1003" },
  // Sold / lost (realistic for the status filters and the plan limit)
  { tag: "TR-1013", name: "Alaca", species: "CATTLE", breed: "Jersey", gender: "FEMALE", birthYear: 2018, birthMonth: 6, status: "SOLD" },
  { tag: "TR-1014", name: "Kınalı", species: "CATTLE", breed: "Holstein", gender: "FEMALE", birthYear: 2017, birthMonth: 8, status: "DECEASED" },
  // Sheep
  { tag: "TR-2001", name: "Boncuk", species: "SHEEP", breed: "Merinos", gender: "FEMALE", birthYear: 2022, birthMonth: 4, status: "ACTIVE", weightBase: 68 },
  { tag: "TR-2002", name: "Yumak", species: "SHEEP", breed: "Merinos", gender: "FEMALE", birthYear: 2023, birthMonth: 3, status: "ACTIVE", weightBase: 61 },
  { tag: "TR-2003", name: "Karabaş", species: "SHEEP", breed: "İvesi", gender: "MALE", birthYear: 2021, birthMonth: 5, status: "ACTIVE", weightBase: 92 },
  { tag: "TR-2004", name: "Tomurcuk", species: "SHEEP", breed: "İvesi", gender: "FEMALE", birthYear: 2023, birthMonth: 9, status: "ACTIVE", weightBase: 58 },
  { tag: "TR-2005", name: "Kuzu", species: "SHEEP", breed: "Merinos", gender: "FEMALE", birthYear: 2026, birthMonth: 1, status: "ACTIVE", weightBase: 22, motherTag: "TR-2001" },
  { tag: "TR-2006", name: "Pıtırcık", species: "SHEEP", breed: "Merinos", gender: "MALE", birthYear: 2026, birthMonth: 1, status: "ACTIVE", weightBase: 24, motherTag: "TR-2002" },
  { tag: "TR-2007", name: "Sütlaç", species: "SHEEP", breed: "İvesi", gender: "FEMALE", birthYear: 2024, birthMonth: 2, status: "ACTIVE", weightBase: 54 },
  // Goats
  { tag: "TR-3001", name: "Şeker", species: "GOAT", breed: "Saanen", gender: "FEMALE", birthYear: 2022, birthMonth: 6, status: "ACTIVE", milkBase: 4.2, weightBase: 62 },
  { tag: "TR-3002", name: "Kekik", species: "GOAT", breed: "Saanen", gender: "FEMALE", birthYear: 2023, birthMonth: 4, status: "ACTIVE", milkBase: 3.6, weightBase: 57 },
  { tag: "TR-3003", name: "Çakıl", species: "GOAT", breed: "Kıl Keçisi", gender: "MALE", birthYear: 2021, birthMonth: 8, status: "ACTIVE", weightBase: 74 },
  { tag: "TR-3004", name: "Zümrüt", species: "GOAT", breed: "Kıl Keçisi", gender: "FEMALE", birthYear: 2024, birthMonth: 3, status: "ACTIVE", weightBase: 48 },
  // Poultry
  { tag: "TR-4001", name: "Sülün", species: "CHICKEN", breed: "Lohmann Brown", gender: "FEMALE", birthYear: 2025, birthMonth: 5, status: "ACTIVE" },
  { tag: "TR-4002", name: "Alacakanat", species: "CHICKEN", breed: "Lohmann Brown", gender: "FEMALE", birthYear: 2025, birthMonth: 5, status: "ACTIVE" },
  { tag: "TR-4003", name: "Horoz Bey", species: "CHICKEN", breed: "Denizli", gender: "MALE", birthYear: 2024, birthMonth: 9, status: "ACTIVE" },
];

const FIELDS = [
  { name: "Dere Tarlası", area: 42.5, location: "Köy altı, dere kenarı", posX: 80, posY: 90, notes: "Sulama kanalına bitişik; taban suyu yüksek." },
  { name: "Tepe Tarlası", area: 68, location: "Kuzey sırt", posX: 340, posY: 110, notes: "Rüzgâra açık, eğimli." },
  { name: "Çayır", area: 24, location: "Dere kenarı", posX: 120, posY: 430, notes: "Yonca için ayrıldı." },
  { name: "Aşağı Tarla", area: 31.5, location: "Köy girişi", posX: 520, posY: 250, notes: null },
  { name: "Karataş", area: 55, location: "Doğu yamaç", posX: 610, posY: 470, notes: "Taşlı; derin sürüm gerektiriyor." },
  { name: "Söğütlük", area: 18, location: "Batı sınır", posX: 220, posY: 250, notes: null },
];

const STRUCTURES = [
  { name: "Büyükbaş Ahırı", type: "BARN" as const, posX: 650, posY: 110, notes: "40 büyükbaş kapasiteli, otomatik suluklu." },
  { name: "Küçükbaş Ağılı", type: "BARN" as const, posX: 760, posY: 300, notes: "Koyun ve keçiler için." },
  { name: "Tavuk Kümesi", type: "COOP" as const, posX: 700, posY: 340, notes: "Gezinme alanı bağlantılı." },
  { name: "Yem Deposu", type: "STORAGE" as const, posX: 430, posY: 440, notes: "Kuru yem ve kesif yem." },
  { name: "Süt Soğutma Odası", type: "OTHER" as const, posX: 560, posY: 90, notes: "2 tonluk soğutma tankı." },
];

const PRODUCTS = [
  { name: "Köy Yumurtası (15'li)", description: "Gezen tavuk, günlük toplanır.", price: 120, unit: "paket", active: true },
  { name: "Çiğ Süt", description: "Günlük sağım, soğuk zincirle teslim.", price: 42, unit: "litre", active: true },
  { name: "Tulum Peyniri", description: "Tam yağlı, altı ay olgunlaştırılmış.", price: 480, unit: "kg", active: true },
  { name: "Çiçek Balı", description: "Doğal, katkısız, süzme.", price: 620, unit: "kg", active: true },
  { name: "Keçi Peyniri", description: "Saanen keçi sütünden, az tuzlu.", price: 540, unit: "kg", active: true },
  { name: "Kuzu Eti (Karkas)", description: "Sipariş üzerine kesim.", price: 780, unit: "kg", active: false },
];

const CUSTOMERS = [
  { name: "Mehmet Yılmaz", phone: "0532 000 0001", email: null, notes: "Haftalık süt alıyor." },
  { name: "Ayşe Demir", phone: "0532 000 0002", email: "ayse@example.com", notes: null },
  { name: "Köy Bakkalı", phone: "0532 000 0003", email: null, notes: "Toptan alıcı, ayın 1'inde ödeme." },
  { name: "Yeşil Market", phone: "0532 000 0004", email: "satinalma@example.com", notes: "Peynir ve bal alıyor." },
  { name: "Hüseyin Kaya", phone: "0532 000 0005", email: null, notes: null },
  { name: "Anadolu Mandıra", phone: "0532 000 0006", email: "mandira@example.com", notes: "Toplu çiğ süt alımı." },
];

// --- Wipe -------------------------------------------------------------------

// Empties the demo tenant's CONTENT. Cascading children (health/vaccination/milk/
// weight/breeding, crops, feed logs, order items) go with their parent; only the
// parents and the rows without a cascade are deleted here.
//
// The forTenant extension injects tenantId into deleteMany automatically, so an
// empty `where` is safe: only the demo tenant's rows are removed.
//
// DELIBERATELY UNTOUCHED — these are not demo "content":
//   - User        : identity. This tenant also holds the first administrator
//                   created from ADMIN_EMAIL and the e2e test accounts; a nightly
//                   reset deleting those would be real loss of access.
//   - Invitation  : pending invitations belong to a user, not to the demo data.
//   - AuditLog    : a security and audit trail; deleting it destroys the trail.
async function wipeDemoTenant(db: TenantDb): Promise<void> {
  await db.orderItem.deleteMany({});
  await db.order.deleteMany({});
  await db.sale.deleteMany({});
  await db.transaction.deleteMany({});
  await db.customer.deleteMany({});
  await db.product.deleteMany({});
  await db.feedLog.deleteMany({});
  await db.inventoryItem.deleteMany({});
  await db.breedingRecord.deleteMany({});
  await db.weightRecord.deleteMany({});
  await db.milkYield.deleteMany({});
  await db.vaccination.deleteMany({});
  await db.healthRecord.deleteMany({});
  // The offspring -> mother relation is SetNull, so one deleteMany is enough.
  await db.animal.deleteMany({});
  await db.crop.deleteMany({});
  await db.field.deleteMany({});
  await db.structure.deleteMany({});
  await db.task.deleteMany({});
}

// --- Populate ---------------------------------------------------------------

async function buildDemoTenant(): Promise<void> {
  const rnd = makeRandom(20260825);
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // 1) Showcase accounts — one per role (see DEMO_ACCOUNTS).
  //    The read-only guard is keyed on the email address (src/lib/authz.ts
  //    isDemoUser) and is independent of role.
  //    upsert is used because users are NOT deleted on reset: an existing one has
  //    its name, password and role refreshed, a missing one is created.
  //
  //    Tasks are assigned to the ADMIN account (demoUserId below), because task
  //    assignment is ADMIN-only (authz.ts writePermissions.tasks).
  const demoUserId = await seedTx(async (db) => {
    let adminId = "";
    for (const account of DEMO_ACCOUNTS) {
      const user = await db.user.upsert({
        where: { email: account.email },
        update: {
          name: account.name,
          password: passwordHash,
          role: account.role,
        },
        create: {
          tenantId: TENANT_ID,
          name: account.name,
          email: account.email,
          password: passwordHash,
          role: account.role,
        },
      });
      if (account.email === DEMO_EMAIL) adminId = user.id;
    }
    return adminId;
  });

  // 2) Structures, fields and their crops (for the map and field economics).
  await seedTx(async (db) => {
    await db.structure.createMany({
      data: STRUCTURES.map((s) => ({ ...s, tenantId: TENANT_ID })),
    });

    const created = [];
    for (const f of FIELDS) {
      created.push(await db.field.create({ data: { ...f, tenantId: TENANT_ID } }));
    }

    // Crops: some harvested (cost/revenue/yield filled in, so the per-decare
    // economics can be computed), some growing, one just planted.
    const crops: Prisma.CropCreateManyInput[] = [
      { tenantId: TENANT_ID, fieldId: created[0].id, name: "Buğday", plantedDate: monthsAgo(10, 5), harvestDate: monthsAgo(2, 20), status: "HARVESTED", cost: 48000, revenue: 96500, yieldAmount: 19300 },
      { tenantId: TENANT_ID, fieldId: created[0].id, name: "Silajlık Mısır", plantedDate: monthsAgo(1, 10), status: "GROWING", cost: 31000 },
      { tenantId: TENANT_ID, fieldId: created[1].id, name: "Arpa", plantedDate: monthsAgo(9, 12), harvestDate: monthsAgo(3, 8), status: "HARVESTED", cost: 62000, revenue: 118000, yieldAmount: 26500 },
      { tenantId: TENANT_ID, fieldId: created[1].id, name: "Ayçiçeği", plantedDate: monthsAgo(2, 2), status: "GROWING", cost: 44000 },
      { tenantId: TENANT_ID, fieldId: created[2].id, name: "Yonca", plantedDate: monthsAgo(14, 18), harvestDate: monthsAgo(1, 25), status: "HARVESTED", cost: 15000, revenue: 41000, yieldAmount: 8200, notes: "Yılın üçüncü biçimi." },
      { tenantId: TENANT_ID, fieldId: created[3].id, name: "Nohut", plantedDate: monthsAgo(5, 14), harvestDate: monthsAgo(1, 12), status: "HARVESTED", cost: 22000, revenue: 37500, yieldAmount: 5400 },
      { tenantId: TENANT_ID, fieldId: created[4].id, name: "Buğday", plantedDate: monthsAgo(0, 3), status: "PLANTED", cost: 57000 },
      { tenantId: TENANT_ID, fieldId: created[5].id, name: "Fiğ", plantedDate: monthsAgo(4, 6), harvestDate: daysAhead(21), status: "GROWING", cost: 9500 },
    ];
    await db.crop.createMany({ data: crops });
  });

  // 3) Animals. Mothers first, then offspring (so motherId can be resolved).
  const animalIdByTag = new Map<string, string>();
  await seedTx(async (db) => {
    for (const a of ANIMALS.filter((x) => !x.motherTag)) {
      const created = await db.animal.create({
        data: {
          tenantId: TENANT_ID,
          tagNumber: a.tag,
          name: a.name,
          species: a.species,
          breed: a.breed,
          gender: a.gender,
          birthDate: new Date(Date.UTC(a.birthYear, a.birthMonth - 1, 12)),
          status: a.status,
        },
      });
      animalIdByTag.set(a.tag, created.id);
    }
    for (const a of ANIMALS.filter((x) => x.motherTag)) {
      const created = await db.animal.create({
        data: {
          tenantId: TENANT_ID,
          tagNumber: a.tag,
          name: a.name,
          species: a.species,
          breed: a.breed,
          gender: a.gender,
          birthDate: new Date(Date.UTC(a.birthYear, a.birthMonth - 1, 12)),
          status: a.status,
          motherId: animalIdByTag.get(a.motherTag!) ?? null,
        },
      });
      animalIdByTag.set(a.tag, created.id);
    }
  });

  // 4) Milk yield (last 21 days) and weight measurements (last 5 months) — for
  //    the charts.
  await seedTx(async (db) => {
    const milk: Prisma.MilkYieldCreateManyInput[] = [];
    for (const a of ANIMALS) {
      if (!a.milkBase || a.status !== "ACTIVE") continue;
      const id = animalIdByTag.get(a.tag)!;
      for (let d = 20; d >= 0; d--) {
        // Slight variation plus a lactation curve tapering off gently.
        const drift = a.milkBase * (1 - d * 0.0015);
        const noise = (rnd() - 0.5) * a.milkBase * 0.14;
        milk.push({
          tenantId: TENANT_ID,
          animalId: id,
          date: daysAgo(d),
          amount: round(Math.max(0.5, drift + noise), 1),
        });
      }
    }
    await db.milkYield.createMany({ data: milk });

    const weights: Prisma.WeightRecordCreateManyInput[] = [];
    for (const a of ANIMALS) {
      if (!a.weightBase || a.status !== "ACTIVE") continue;
      const id = animalIdByTag.get(a.tag)!;
      // Young animals grow fast, adults slowly.
      const growth = a.weightBase < 200 ? 0.075 : 0.012;
      for (let m = 4; m >= 0; m--) {
        const base = a.weightBase * (1 - growth * m);
        const noise = (rnd() - 0.5) * a.weightBase * 0.02;
        weights.push({
          tenantId: TENANT_ID,
          animalId: id,
          date: monthsAgo(m, 10),
          weightKg: round(Math.max(5, base + noise), 1),
        });
      }
    }
    await db.weightRecord.createMany({ data: weights });
  });

  // 5) Health, vaccination and breeding records. Some fall within the NEXT 30
  //    days so the dashboard's "upcoming vaccinations" alert and the calendar
  //    both have something in them.
  await seedTx(async (db) => {
    const id = (tag: string) => animalIdByTag.get(tag)!;

    await db.healthRecord.createMany({
      data: [
        { tenantId: TENANT_ID, animalId: id("TR-1001"), date: daysAgo(34), diagnosis: "Ayak enfeksiyonu", treatment: "Antibiyotik + ayak banyosu", notes: "İki hafta sonra kontrol edildi, iyileşti." },
        { tenantId: TENANT_ID, animalId: id("TR-1005"), date: daysAgo(19), diagnosis: "Mastitis (hafif)", treatment: "Meme içi antibiyotik", notes: "Sütü 5 gün ayrı toplandı." },
        { tenantId: TENANT_ID, animalId: id("TR-2003"), date: daysAgo(12), diagnosis: "Parazit kontrolü", treatment: "Geniş spektrumlu antiparaziter" },
        { tenantId: TENANT_ID, animalId: id("TR-3001"), date: daysAgo(47), diagnosis: "İştahsızlık", treatment: "Vitamin takviyesi", notes: "Üç günde düzeldi." },
        { tenantId: TENANT_ID, animalId: id("TR-1008"), date: daysAgo(6), diagnosis: "Rutin muayene", treatment: "Bulgu yok" },
      ],
    });

    await db.vaccination.createMany({
      data: [
        { tenantId: TENANT_ID, animalId: id("TR-1001"), name: "Şap Aşısı", date: daysAgo(150), nextDate: daysAhead(9), notes: "Altı ayda bir." },
        { tenantId: TENANT_ID, animalId: id("TR-1002"), name: "Şap Aşısı", date: daysAgo(150), nextDate: daysAhead(9) },
        { tenantId: TENANT_ID, animalId: id("TR-1003"), name: "Brucella", date: daysAgo(300), nextDate: daysAhead(24) },
        { tenantId: TENANT_ID, animalId: id("TR-1004"), name: "Şap Aşısı", date: daysAgo(140), nextDate: daysAhead(41) },
        { tenantId: TENANT_ID, animalId: id("TR-2001"), name: "Enterotoksemi", date: daysAgo(95), nextDate: daysAhead(16) },
        { tenantId: TENANT_ID, animalId: id("TR-2003"), name: "Enterotoksemi", date: daysAgo(95), nextDate: daysAhead(16) },
        { tenantId: TENANT_ID, animalId: id("TR-3001"), name: "Keçi Ciğer Ağrısı", date: daysAgo(210), nextDate: daysAhead(58) },
        { tenantId: TENANT_ID, animalId: id("TR-4003"), name: "Newcastle", date: daysAgo(60), nextDate: daysAhead(32) },
      ],
    });

    await db.breedingRecord.createMany({
      data: [
        { tenantId: TENANT_ID, animalId: id("TR-1001"), sireTag: "TR-1007", breedingDate: daysAgo(320), expectedBirthDate: daysAgo(37), actualBirthDate: daysAgo(35), status: "BORN", offspringCount: 1, notes: "Sorunsuz doğum." },
        { tenantId: TENANT_ID, animalId: id("TR-1002"), sireTag: "TR-1007", breedingDate: daysAgo(250), expectedBirthDate: daysAhead(30), status: "PREGNANT" },
        { tenantId: TENANT_ID, animalId: id("TR-1005"), sireTag: "Suni tohumlama", breedingDate: daysAgo(60), expectedBirthDate: daysAhead(220), status: "PREGNANT" },
        { tenantId: TENANT_ID, animalId: id("TR-1006"), sireTag: "TR-1007", breedingDate: daysAgo(40), status: "PLANNED" },
        { tenantId: TENANT_ID, animalId: id("TR-1004"), sireTag: "Suni tohumlama", breedingDate: daysAgo(180), status: "FAILED", notes: "Gebelik tutmadı, tekrar denenecek." },
      ],
    });
  });

  // 6) Inventory and feed — some at a CRITICAL level (dashboard alert plus the
  //    feed consumption flow).
  await seedTx(async (db) => {
    const items = [
      { name: "Arpa Kırması", category: "FEED" as const, quantity: 1850, unit: "kg", criticalLevel: 400, notes: null },
      { name: "Süt Yemi (18 protein)", category: "FEED" as const, quantity: 320, unit: "kg", criticalLevel: 500, notes: "Kritik seviyenin altında — sipariş verilmeli." },
      { name: "Kuru Yonca Balyası", category: "FEED" as const, quantity: 140, unit: "balya", criticalLevel: 60, notes: null },
      { name: "Mısır Silajı", category: "FEED" as const, quantity: 4200, unit: "kg", criticalLevel: 1000, notes: null },
      { name: "Antibiyotik (Enjeksiyon)", category: "MEDICINE" as const, quantity: 4, unit: "adet", criticalLevel: 10, notes: "Veteriner reçetesiyle." },
      { name: "Antiparaziter", category: "MEDICINE" as const, quantity: 18, unit: "adet", criticalLevel: 6, notes: null },
      { name: "Traktör Yağı", category: "EQUIPMENT" as const, quantity: 3, unit: "litre", criticalLevel: 8, notes: "Bakım için yetersiz." },
      { name: "Sağım Ünitesi Filtresi", category: "EQUIPMENT" as const, quantity: 45, unit: "adet", criticalLevel: 15, notes: null },
    ];
    await db.inventoryItem.createMany({
      data: items.map((i) => ({ ...i, tenantId: TENANT_ID })),
    });

    // Feed consumption history (the stock deduction is taken as already reflected
    // in the quantities above).
    const feedItems = await db.inventoryItem.findMany({ where: { category: "FEED" } });
    const logs: Prisma.FeedLogCreateManyInput[] = [];
    for (let d = 13; d >= 0; d--) {
      for (const item of feedItems) {
        if (rnd() < 0.45) continue;
        logs.push({
          tenantId: TENANT_ID,
          inventoryItemId: item.id,
          date: daysAgo(d),
          quantity: round(20 + rnd() * 60, 1),
          notes: null,
        });
      }
    }
    await db.feedLog.createMany({ data: logs });
  });

  // 7) Customers, products, twelve months of finance, sales and orders.
  await seedTx(async (db) => {
    await db.customer.createMany({
      data: CUSTOMERS.map((c) => ({ ...c, tenantId: TENANT_ID })),
    });
    await db.product.createMany({
      data: PRODUCTS.map((p) => ({ ...p, tenantId: TENANT_ID })),
    });

    // Twelve months of income and expense, so the monthly chart is full end to
    // end.
    const tx: Prisma.TransactionCreateManyInput[] = [];
    for (let m = 11; m >= 0; m--) {
      const seasonal = 1 + Math.sin(((11 - m) / 12) * Math.PI * 2) * 0.18;
      tx.push(
        { tenantId: TENANT_ID, type: "INCOME", amount: Math.round((38000 + rnd() * 9000) * seasonal), category: "Süt satışı", date: monthsAgo(m, 26), description: "Aylık toplu süt teslimatı" },
        { tenantId: TENANT_ID, type: "EXPENSE", amount: Math.round((16000 + rnd() * 4500) * seasonal), category: "Yem alımı", date: monthsAgo(m, 4), description: "Kesif yem ve kaba yem" },
        { tenantId: TENANT_ID, type: "EXPENSE", amount: Math.round(4200 + rnd() * 2600), category: "Veteriner", date: monthsAgo(m, 11), description: "Rutin kontrol ve ilaç" },
        { tenantId: TENANT_ID, type: "EXPENSE", amount: Math.round(7800 + rnd() * 2200), category: "Akaryakıt", date: monthsAgo(m, 18), description: "Traktör ve jeneratör" },
      );
      // Extra income/expense in some months, so the chart is not monotonous.
      if (m % 3 === 0) {
        tx.push({ tenantId: TENANT_ID, type: "INCOME", amount: Math.round(24000 + rnd() * 12000), category: "Hayvan satışı", date: monthsAgo(m, 21), description: "Besi danası satışı" });
      }
      if (m % 4 === 1) {
        tx.push({ tenantId: TENANT_ID, type: "EXPENSE", amount: Math.round(15000 + rnd() * 8000), category: "Bakım-onarım", date: monthsAgo(m, 8), description: "Ekipman bakımı" });
      }
    }
    await db.transaction.createMany({ data: tx });

    // Sales: each one produces a linked INCOME transaction — the same flow the
    // application itself uses.
    const customers = await db.customer.findMany({ orderBy: { name: "asc" } });
    const saleDefs = [
      { item: "Çiğ Süt 400 L", customer: 3, quantity: 400, unit: "litre", amount: 16800, days: 3 },
      { item: "Tulum Peyniri 12 kg", customer: 5, quantity: 12, unit: "kg", amount: 5760, days: 8 },
      { item: "Köy Yumurtası 40 paket", customer: 2, quantity: 40, unit: "paket", amount: 4800, days: 11 },
      { item: "Çiçek Balı 15 kg", customer: 5, quantity: 15, unit: "kg", amount: 9300, days: 16 },
      { item: "Besi Danası (TR-1013)", customer: 1, amount: 48000, days: 24 },
      { item: "Çiğ Süt 350 L", customer: 0, quantity: 350, unit: "litre", amount: 14700, days: 31 },
      { item: "Keçi Peyniri 9 kg", customer: 4, quantity: 9, unit: "kg", amount: 4860, days: 38 },
      { item: "Kuzu (2 baş)", customer: 1, quantity: 2, unit: "baş", amount: 21000, days: 52 },
      { item: "Çiğ Süt 500 L", customer: 5, quantity: 500, unit: "litre", amount: 21000, days: 63 },
      { item: "Yonca Balyası 60 adet", customer: 2, quantity: 60, unit: "balya", amount: 12000, days: 77 },
    ];
    for (const s of saleDefs) {
      const c = customers[s.customer];
      const date = daysAgo(s.days);
      const transaction = await db.transaction.create({
        data: {
          tenantId: TENANT_ID,
          type: "INCOME",
          amount: s.amount,
          category: "Satış",
          date,
          description: c ? `${s.item} — ${c.name}` : s.item,
        },
      });
      await db.sale.create({
        data: {
          tenantId: TENANT_ID,
          item: s.item,
          customerId: c?.id ?? null,
          quantity: s.quantity ?? null,
          unit: s.unit ?? null,
          amount: s.amount,
          date,
          transactionId: transaction.id,
        },
      });
    }

    // Storefront orders in a range of states (with price and name snapshots).
    const products = await db.product.findMany({ where: { active: true }, orderBy: { name: "asc" } });
    const line = (p: (typeof products)[number], qty: number) => ({
      tenantId: TENANT_ID,
      productId: p.id,
      productName: p.name,
      unitPrice: p.price,
      quantity: qty,
      lineTotal: round(p.price * qty, 2),
    });
    const orderDefs: Array<{
      customerName: string;
      customerPhone: string | null;
      note: string | null;
      status: "PENDING" | "CONFIRMED" | "CANCELLED";
      paymentStatus: "UNPAID" | "PAID";
      days: number;
      items: Array<[number, number]>;
    }> = [
      { customerName: "Zeynep Kaya", customerPhone: "0533 111 2233", note: "Cuma sabahı teslim alacağım.", status: "PENDING", paymentStatus: "UNPAID", days: 1, items: [[0, 2], [1, 3]] },
      { customerName: "Ali Vural", customerPhone: "0533 444 5566", note: null, status: "CONFIRMED", paymentStatus: "PAID", days: 4, items: [[3, 2]] },
      { customerName: "Elif Şahin", customerPhone: "0533 777 8899", note: "Kapıda ödeme.", status: "CONFIRMED", paymentStatus: "UNPAID", days: 9, items: [[2, 1], [4, 2]] },
      { customerName: "Burak Aydın", customerPhone: "0534 222 3344", note: null, status: "CANCELLED", paymentStatus: "UNPAID", days: 14, items: [[1, 10]] },
      { customerName: "Nalan Öztürk", customerPhone: "0535 666 7788", note: "Hediye paketi olsun.", status: "CONFIRMED", paymentStatus: "PAID", days: 21, items: [[3, 1], [0, 4], [2, 1]] },
    ];
    for (const o of orderDefs) {
      const items = o.items
        .filter(([i]) => products[i])
        .map(([i, qty]) => line(products[i], qty));
      if (items.length === 0) continue;
      await db.order.create({
        data: {
          tenantId: TENANT_ID,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          note: o.note,
          total: round(items.reduce((sum, it) => sum + it.lineTotal, 0), 2),
          status: o.status,
          paymentStatus: o.paymentStatus,
          createdAt: daysAgo(o.days),
          items: { create: items },
        },
      });
    }
  });

  // 8) Tasks — some OVERDUE (dashboard alert), some already done.
  await seedTx(async (db) => {
    await db.task.createMany({
      data: [
        { tenantId: TENANT_ID, title: "Süt yemi siparişi ver", description: "Stok kritik seviyenin altına düştü.", assignedToId: demoUserId, status: "PENDING", dueDate: daysAgo(4) },
        { tenantId: TENANT_ID, title: "Traktör periyodik bakımı", description: "Yağ ve filtre değişimi.", assignedToId: demoUserId, status: "PENDING", dueDate: daysAgo(1) },
        { tenantId: TENANT_ID, title: "Şap aşısı hatırlatması", description: "TR-1001 ve TR-1002 için randevu alınacak.", assignedToId: demoUserId, status: "IN_PROGRESS", dueDate: daysAhead(6) },
        { tenantId: TENANT_ID, title: "Ahır temizliği", description: "Haftalık genel temizlik ve altlık yenileme.", assignedToId: demoUserId, status: "IN_PROGRESS", dueDate: daysAhead(2) },
        { tenantId: TENANT_ID, title: "Silaj çukuru kontrolü", description: null, assignedToId: demoUserId, status: "PENDING", dueDate: daysAhead(11) },
        { tenantId: TENANT_ID, title: "Süt tankı kalibrasyonu", description: "Soğutma sıcaklığı ölçüldü, normal.", assignedToId: demoUserId, status: "DONE", dueDate: daysAgo(9) },
        { tenantId: TENANT_ID, title: "Yonca biçimi", description: "Üçüncü biçim tamamlandı.", assignedToId: demoUserId, status: "DONE", dueDate: daysAgo(26) },
        { tenantId: TENANT_ID, title: "Kümes yem otomatı onarımı", description: null, assignedToId: demoUserId, status: "DONE", dueDate: daysAgo(40) },
      ],
    });
  });
}

// --- Public entry point -----------------------------------------------------

export type SeedDemoResult = {
  seeded: boolean;
  reason: "reset" | "version-changed" | "empty" | "demo-account-missing" | "up-to-date";
  version: string;
};

/**
 * Resets and repopulates the demo (showcase) tenant when needed.
 *
 * - `reset: true`  -> wipe and rebuild unconditionally (the nightly cron).
 * - `reset: false` -> rebuild if the version is stale, the tenant is empty OR a
 *   showcase account has gone missing (build/CLI).
 */
export async function seedDemo(
  options: { reset?: boolean } = {}
): Promise<SeedDemoResult> {
  const { reset = false } = options;

  // Tenant and SeedState are outside RLS: read and written through plain `prisma`.
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    // The name is refreshed too: the showcase tenant's name is demo content and
    // shows up in the /magaza directory (older installs were left reading
    // "Varsayilan Ciftlik").
    // The slug is NOT changed — the public storefront URLs depend on it.
    // The showcase tenant is PRO (no limits); new sign-ups start on FREE.
    update: { name: TENANT_NAME, plan: "PRO" },
    create: { id: TENANT_ID, name: TENANT_NAME, slug: TENANT_SLUG, plan: "PRO" },
  });

  const state = await prisma.seedState.findUnique({ where: { key: SEED_STATE_KEY } });

  // Self-repair probe. "Are there any animals?" is NOT enough on its own:
  // `npm run db:seed` shares this tenant, deletes the demo users and writes its
  // own animals. In that state the animal count is > 0 and the version has not
  // changed, so the showcase sign-ins would be lost permanently. That is why the
  // showcase's own marker is checked as well.
  //
  // The FULL COUNT is required, not merely non-zero: if only one account was
  // removed — someone deleting it by hand from the staff screen, say — it still
  // has to be rebuilt. A "> 0" check would ignore that partial damage.
  const probe = await seedTx(async (db) => ({
    animals: await db.animal.count(),
    demoAccounts: await db.user.count({
      where: { email: { in: [...DEMO_EMAILS] } },
    }),
  }));

  let reason: SeedDemoResult["reason"];
  if (reset) reason = "reset";
  else if (state?.value !== DEMO_DATA_VERSION) reason = "version-changed";
  else if (probe.animals === 0) reason = "empty";
  else if (probe.demoAccounts < DEMO_ACCOUNTS.length) reason = "demo-account-missing";
  else {
    return { seeded: false, reason: "up-to-date", version: DEMO_DATA_VERSION };
  }

  await seedTx((db) => wipeDemoTenant(db));
  await buildDemoTenant();

  await prisma.seedState.upsert({
    where: { key: SEED_STATE_KEY },
    update: { value: DEMO_DATA_VERSION },
    create: { key: SEED_STATE_KEY, value: DEMO_DATA_VERSION },
  });

  return { seeded: true, reason, version: DEMO_DATA_VERSION };
}
