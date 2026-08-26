import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withTenant, type TenantDb } from "@/lib/tenant-prisma";
import { hashPassword } from "@/lib/password-hash";

// Vitrin (demo) tenant'inin verisi — TEK KAYNAK.
//
// Uc yerden cagrilir:
//   1. `npm run db:seed-demo`      (yerel gelistirme)
//   2. Uretim derlemesi            (vercel.json buildCommand)
//   3. Gecelik cron                (/api/cron/demo-reset, reset: true)
//
// SURUMLEME: Kodun tasidigi DEMO_DATA_VERSION ile veritabanindaki
// SeedState("demoDataVersion") karsilastirilir. Farkliysa demo tenant'i
// sifirlanip yeniden doldurulur; ayniysa hicbir sey yapilmaz. Boylece demo
// verisi elle mudahale gerektirmeden, kendi kendini onararak guncel kalir.
//
// RLS: Tenant ve SeedState RLS disidir (dogrudan `prisma`). Diger her sey
// tenant-kapsamlidir ve `withTenant` icinde calisir — uretimde uygulama
// non-superuser rolle baglandigindan baglam olmadan HICBIR satir gorunmez.

export const TENANT_ID = "default-tenant";
export const TENANT_SLUG = "default";
export const TENANT_NAME = "Yeşilvadi Çiftliği";
export const DEMO_EMAIL = "demo@ciftlik.com";
export const DEMO_PASSWORD = "demo1234";

// Demo veri surumu. Icerigi her degistirdiginizde ARTIRIN; bir sonraki
// dagitim/cron calismasinda demo tenant'i otomatik yeniden kurulur.
export const DEMO_DATA_VERSION = "3";

const SEED_STATE_KEY = "demoDataVersion";

// Seed isleri toplu yazma yapar ve uretimde havuzlanmis (Neon/pgbouncer)
// baglanti uzerinden calisir; Prisma'nin 5sn'lik varsayilan interaktif
// transaction zaman asimi burada dar kalabilir. Yalnizca bu yol icin yukseltilir.
const SEED_TX = { timeout: 30_000, maxWait: 10_000 } as const;

function seedTx<T>(fn: (db: TenantDb) => Promise<T>): Promise<T> {
  return withTenant(TENANT_ID, fn, SEED_TX);
}

// --- Tarih yardimcilari -----------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}

function daysAhead(n: number): Date {
  return new Date(Date.now() + n * DAY_MS);
}

// n ay once, ayin belirtilen gunu (aylik finans grafigini duzgun doldurmak icin).
function monthsAgo(n: number, day = 15): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return d;
}

// Deterministik sozde-rastgele (mulberry32). Ayni surum ayni veriyi uretsin
// diye sabit tohumla calisir; boylece ekran goruntuleri de kararli kalir.
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

// --- Sabit icerik -----------------------------------------------------------

type AnimalSeed = {
  tag: string;
  name: string;
  species: "CATTLE" | "SHEEP" | "GOAT" | "CHICKEN" | "OTHER";
  breed: string;
  gender: "FEMALE" | "MALE";
  birthYear: number;
  birthMonth: number;
  status: "ACTIVE" | "SOLD" | "DECEASED";
  // Sagmal inekler: gunluk sut verimi grafigi bunlar icin uretilir.
  milkBase?: number;
  // Buyume grafigi bunlar icin uretilir (kg).
  weightBase?: number;
  motherTag?: string;
};

const ANIMALS: AnimalSeed[] = [
  // Sagmal inekler (sut verimi grafikleri)
  { tag: "TR-1001", name: "Sarıkız", species: "CATTLE", breed: "Holstein", gender: "FEMALE", birthYear: 2021, birthMonth: 3, status: "ACTIVE", milkBase: 27, weightBase: 620 },
  { tag: "TR-1002", name: "Karagöz", species: "CATTLE", breed: "Simental", gender: "FEMALE", birthYear: 2020, birthMonth: 7, status: "ACTIVE", milkBase: 23, weightBase: 655 },
  { tag: "TR-1003", name: "Benekli", species: "CATTLE", breed: "Holstein", gender: "FEMALE", birthYear: 2022, birthMonth: 1, status: "ACTIVE", milkBase: 25, weightBase: 590 },
  { tag: "TR-1004", name: "Gelincik", species: "CATTLE", breed: "Jersey", gender: "FEMALE", birthYear: 2021, birthMonth: 11, status: "ACTIVE", milkBase: 19, weightBase: 480 },
  { tag: "TR-1005", name: "Menekşe", species: "CATTLE", breed: "Simental", gender: "FEMALE", birthYear: 2019, birthMonth: 4, status: "ACTIVE", milkBase: 21, weightBase: 670 },
  { tag: "TR-1006", name: "Zeytin", species: "CATTLE", breed: "Holstein", gender: "FEMALE", birthYear: 2022, birthMonth: 9, status: "ACTIVE", milkBase: 24, weightBase: 545 },
  // Damizlik boga + besi danalari (agirlik takibi)
  { tag: "TR-1007", name: "Boğaç", species: "CATTLE", breed: "Simental", gender: "MALE", birthYear: 2020, birthMonth: 2, status: "ACTIVE", weightBase: 880 },
  { tag: "TR-1008", name: "Kömür", species: "CATTLE", breed: "Angus", gender: "MALE", birthYear: 2024, birthMonth: 3, status: "ACTIVE", weightBase: 340 },
  { tag: "TR-1009", name: "Fındık", species: "CATTLE", breed: "Angus", gender: "MALE", birthYear: 2024, birthMonth: 5, status: "ACTIVE", weightBase: 305 },
  // Yavrular (soy bagi: anne kulak numarasi)
  { tag: "TR-1010", name: "Pamuk", species: "CATTLE", breed: "Holstein", gender: "FEMALE", birthYear: 2025, birthMonth: 10, status: "ACTIVE", weightBase: 145, motherTag: "TR-1001" },
  { tag: "TR-1011", name: "Duman", species: "CATTLE", breed: "Simental", gender: "MALE", birthYear: 2025, birthMonth: 12, status: "ACTIVE", weightBase: 120, motherTag: "TR-1002" },
  { tag: "TR-1012", name: "Yıldız", species: "CATTLE", breed: "Holstein", gender: "FEMALE", birthYear: 2026, birthMonth: 2, status: "ACTIVE", weightBase: 95, motherTag: "TR-1003" },
  // Satilan / kaybedilen (durum filtreleri ve plan limiti icin gercekci)
  { tag: "TR-1013", name: "Alaca", species: "CATTLE", breed: "Jersey", gender: "FEMALE", birthYear: 2018, birthMonth: 6, status: "SOLD" },
  { tag: "TR-1014", name: "Kınalı", species: "CATTLE", breed: "Holstein", gender: "FEMALE", birthYear: 2017, birthMonth: 8, status: "DECEASED" },
  // Koyunlar
  { tag: "TR-2001", name: "Boncuk", species: "SHEEP", breed: "Merinos", gender: "FEMALE", birthYear: 2022, birthMonth: 4, status: "ACTIVE", weightBase: 68 },
  { tag: "TR-2002", name: "Yumak", species: "SHEEP", breed: "Merinos", gender: "FEMALE", birthYear: 2023, birthMonth: 3, status: "ACTIVE", weightBase: 61 },
  { tag: "TR-2003", name: "Karabaş", species: "SHEEP", breed: "İvesi", gender: "MALE", birthYear: 2021, birthMonth: 5, status: "ACTIVE", weightBase: 92 },
  { tag: "TR-2004", name: "Tomurcuk", species: "SHEEP", breed: "İvesi", gender: "FEMALE", birthYear: 2023, birthMonth: 9, status: "ACTIVE", weightBase: 58 },
  { tag: "TR-2005", name: "Kuzu", species: "SHEEP", breed: "Merinos", gender: "FEMALE", birthYear: 2026, birthMonth: 1, status: "ACTIVE", weightBase: 22, motherTag: "TR-2001" },
  { tag: "TR-2006", name: "Pıtırcık", species: "SHEEP", breed: "Merinos", gender: "MALE", birthYear: 2026, birthMonth: 1, status: "ACTIVE", weightBase: 24, motherTag: "TR-2002" },
  { tag: "TR-2007", name: "Sütlaç", species: "SHEEP", breed: "İvesi", gender: "FEMALE", birthYear: 2024, birthMonth: 2, status: "ACTIVE", weightBase: 54 },
  // Keciler
  { tag: "TR-3001", name: "Şeker", species: "GOAT", breed: "Saanen", gender: "FEMALE", birthYear: 2022, birthMonth: 6, status: "ACTIVE", milkBase: 4.2, weightBase: 62 },
  { tag: "TR-3002", name: "Kekik", species: "GOAT", breed: "Saanen", gender: "FEMALE", birthYear: 2023, birthMonth: 4, status: "ACTIVE", milkBase: 3.6, weightBase: 57 },
  { tag: "TR-3003", name: "Çakıl", species: "GOAT", breed: "Kıl Keçisi", gender: "MALE", birthYear: 2021, birthMonth: 8, status: "ACTIVE", weightBase: 74 },
  { tag: "TR-3004", name: "Zümrüt", species: "GOAT", breed: "Kıl Keçisi", gender: "FEMALE", birthYear: 2024, birthMonth: 3, status: "ACTIVE", weightBase: 48 },
  // Kumes
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

// --- Silme ------------------------------------------------------------------

// Demo tenant'inin ICERIGINI bosaltir. Cascade'li cocuklar (saglik/asi/sut/
// agirlik/ureme, ekim, yem tuketimi, siparis kalemi) ebeveyn silinince otomatik
// gider; burada yalnizca ebeveynleri ve cascade'i olmayanlari siliyoruz.
//
// forTenant eklentisi deleteMany'e otomatik tenantId enjekte ettigi icin bos
// `where` guvenlidir: yalnizca demo tenant'in satirlari silinir.
//
// KASITLI OLARAK DOKUNULMAYANLAR — bunlar demo "icerigi" degil:
//   - User        : kimliktir. Bu tenant ayni zamanda ADMIN_EMAIL ile kurulan
//                   ilk yoneticiyi ve e2e test hesaplarini barindirir; gecelik
//                   sifirlamanin bunlari silmesi gercek erisim kaybi olurdu.
//   - Invitation  : bekleyen davetler kullaniciya aittir, demo verisi degildir.
//   - AuditLog    : guvenlik/denetim izidir; silinmesi izi yok eder.
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
  // Yavru->anne bagi SetNull oldugundan tek deleteMany yeterli.
  await db.animal.deleteMany({});
  await db.crop.deleteMany({});
  await db.field.deleteMany({});
  await db.structure.deleteMany({});
  await db.task.deleteMany({});
}

// --- Doldurma ---------------------------------------------------------------

async function buildDemoTenant(): Promise<void> {
  const rnd = makeRandom(20260825);
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // 1) Demo kullanici (ADMIN — vitrin: abonelik/personel/KVKK ekranlari gezilebilsin).
  //    Salt-okunur koruma e-posta tabanlidir (src/lib/authz.ts isDemoUser), rolden bagimsiz.
  //    Kullanicilar sifirlamada SILINMEDIGINDEN upsert kullanilir: varsa parola/rol
  //    tazelenir, yoksa olusturulur.
  const demoUserId = await seedTx(async (db) => {
    const user = await db.user.upsert({
      where: { email: DEMO_EMAIL },
      update: { name: "Demo Kullanıcı", password: passwordHash, role: "ADMIN" },
      create: {
        tenantId: TENANT_ID,
        name: "Demo Kullanıcı",
        email: DEMO_EMAIL,
        password: passwordHash,
        role: "ADMIN",
      },
    });
    return user.id;
  });

  // 2) Yapilar + tarlalar ve ekimleri (harita ve tarla ekonomisi icin).
  await seedTx(async (db) => {
    await db.structure.createMany({
      data: STRUCTURES.map((s) => ({ ...s, tenantId: TENANT_ID })),
    });

    const created = [];
    for (const f of FIELDS) {
      created.push(await db.field.create({ data: { ...f, tenantId: TENANT_ID } }));
    }

    // Ekimler: bir kismi hasat edilmis (maliyet/gelir/verim dolu -> donum basina
    // ekonomi hesaplanabilsin), bir kismi buyuyor, biri yeni ekildi.
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

  // 3) Hayvanlar. Once anneler, sonra yavrular (motherId cozumlemesi icin).
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

  // 4) Sut verimi (son 21 gun) ve agirlik olcumleri (son 5 ay) — grafikler icin.
  await seedTx(async (db) => {
    const milk: Prisma.MilkYieldCreateManyInput[] = [];
    for (const a of ANIMALS) {
      if (!a.milkBase || a.status !== "ACTIVE") continue;
      const id = animalIdByTag.get(a.tag)!;
      for (let d = 20; d >= 0; d--) {
        // Hafif dalgalanma + yavas dususe gecen laktasyon egrisi.
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
      // Genc hayvanlar hizli, yetiskinler yavas buyur.
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

  // 5) Saglik, asi ve ureme kayitlari. Bir kismi ONUMUZDEKI 30 gun icinde ki
  //    panel "yaklasan asilar" uyarisi ve takvim dolu gorunsun.
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

  // 6) Stok/yem — bir kismi KRITIK seviyede (panel uyarisi + yem tuketim akisi).
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

    // Yem tuketim gecmisi (stok dusumu zaten yukaridaki miktarlara yansitilmis kabul edilir).
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

  // 7) Musteriler, urunler, 12 aylik finans, satislar ve siparisler.
  await seedTx(async (db) => {
    await db.customer.createMany({
      data: CUSTOMERS.map((c) => ({ ...c, tenantId: TENANT_ID })),
    });
    await db.product.createMany({
      data: PRODUCTS.map((p) => ({ ...p, tenantId: TENANT_ID })),
    });

    // 12 aylik gelir/gider — aylik grafik bastan sona dolu gorunsun.
    const tx: Prisma.TransactionCreateManyInput[] = [];
    for (let m = 11; m >= 0; m--) {
      const seasonal = 1 + Math.sin(((11 - m) / 12) * Math.PI * 2) * 0.18;
      tx.push(
        { tenantId: TENANT_ID, type: "INCOME", amount: Math.round((38000 + rnd() * 9000) * seasonal), category: "Süt satışı", date: monthsAgo(m, 26), description: "Aylık toplu süt teslimatı" },
        { tenantId: TENANT_ID, type: "EXPENSE", amount: Math.round((16000 + rnd() * 4500) * seasonal), category: "Yem alımı", date: monthsAgo(m, 4), description: "Kesif yem ve kaba yem" },
        { tenantId: TENANT_ID, type: "EXPENSE", amount: Math.round(4200 + rnd() * 2600), category: "Veteriner", date: monthsAgo(m, 11), description: "Rutin kontrol ve ilaç" },
        { tenantId: TENANT_ID, type: "EXPENSE", amount: Math.round(7800 + rnd() * 2200), category: "Akaryakıt", date: monthsAgo(m, 18), description: "Traktör ve jeneratör" },
      );
      // Bazi aylarda ek gelir/gider (grafik tekduze olmasin).
      if (m % 3 === 0) {
        tx.push({ tenantId: TENANT_ID, type: "INCOME", amount: Math.round(24000 + rnd() * 12000), category: "Hayvan satışı", date: monthsAgo(m, 21), description: "Besi danası satışı" });
      }
      if (m % 4 === 1) {
        tx.push({ tenantId: TENANT_ID, type: "EXPENSE", amount: Math.round(15000 + rnd() * 8000), category: "Bakım-onarım", date: monthsAgo(m, 8), description: "Ekipman bakımı" });
      }
    }
    await db.transaction.createMany({ data: tx });

    // Satislar: her biri bagli bir INCOME islemi uretir (uygulamadaki akisin aynisi).
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

    // Magaza siparisleri — farkli durumlarda (fiyat/ad snapshot'lariyla).
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

  // 8) Gorevler — bir kismi GECIKMIS (panel uyarisi), bir kismi tamamlanmis.
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

// --- Genel giris noktasi ----------------------------------------------------

export type SeedDemoResult = {
  seeded: boolean;
  reason: "reset" | "version-changed" | "empty" | "demo-account-missing" | "up-to-date";
  version: string;
};

/**
 * Demo (vitrin) tenant'ini gerektiginde sifirlayip yeniden doldurur.
 *
 * - `reset: true`  -> kosulsuz sifirla ve yeniden kur (gecelik cron).
 * - `reset: false` -> surum eskiyse, tenant bossa VEYA demo hesabi kaybolmussa kur
 *   (build/CLI).
 */
export async function seedDemo(
  options: { reset?: boolean } = {}
): Promise<SeedDemoResult> {
  const { reset = false } = options;

  // Tenant ve SeedState RLS disidir: dogrudan `prisma` ile okunur/yazilir.
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    // Ad da tazelenir: vitrin tenant'inin adi demo icerigidir ve /magaza
    // dizininde gorunur (eski kurulumlarda "Varsayilan Ciftlik" kaliyordu).
    // Slug DEGISTIRILMEZ — herkese acik magaza URL'leri ona baglidir.
    // Vitrin tenant'i PRO'dur (sinirsiz); yeni kayitlar FREE baslar.
    update: { name: TENANT_NAME, plan: "PRO" },
    create: { id: TENANT_ID, name: TENANT_NAME, slug: TENANT_SLUG, plan: "PRO" },
  });

  const state = await prisma.seedState.findUnique({ where: { key: SEED_STATE_KEY } });

  // Kendi kendini onarma sondasi. "Hic hayvan var mi?" TEK BASINA yetmez:
  // `npm run db:seed` ayni tenant'i paylasir, demo kullanicisini silip yerine
  // kendi hayvanlarini yazar. O durumda hayvan sayisi > 0 oldugu ve surum de
  // degismedigi icin demo hesabi (salt-okunur vitrin girisi) kalici olarak
  // kaybolurdu. Bu yuzden vitrinin kendi isaretini de ariyoruz.
  const probe = await seedTx(async (db) => ({
    animals: await db.animal.count(),
    demoAccounts: await db.user.count({ where: { email: DEMO_EMAIL } }),
  }));

  let reason: SeedDemoResult["reason"];
  if (reset) reason = "reset";
  else if (state?.value !== DEMO_DATA_VERSION) reason = "version-changed";
  else if (probe.animals === 0) reason = "empty";
  else if (probe.demoAccounts === 0) reason = "demo-account-missing";
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
