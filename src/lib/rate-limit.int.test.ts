import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "./prisma";
import { rateLimit, resetRateLimit, pruneRateLimits } from "./rate-limit";

// Verifying the shared (Postgres) rate limiter against a REAL database.
// Unlike the in-memory fallback, this path is common to every server instance,
// which is why the protection is not divided by the instance count on serverless.
//
// Locally:
//   RUN_DB_TESTS=1 npx vitest run src/lib/rate-limit.int.test.ts
const run = Boolean(process.env.RUN_DB_TESTS);

describe.skipIf(!run)("hiz siniri (paylasilan Postgres sayaci)", () => {
  const key = `int-test-${Date.now()}`;

  beforeAll(async () => {
    await prisma.rateLimit.deleteMany({ where: { key: { startsWith: "int-test-" } } });
  });

  beforeEach(async () => {
    await resetRateLimit(key);
  });

  afterAll(async () => {
    await prisma.rateLimit.deleteMany({ where: { key: { startsWith: "int-test-" } } });
    await prisma.$disconnect();
  });

  it("limit altinda izin verir, asilinca engeller", async () => {
    expect((await rateLimit(key, 3, 60_000)).success).toBe(true);
    expect((await rateLimit(key, 3, 60_000)).success).toBe(true);

    const third = await rateLimit(key, 3, 60_000);
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);

    const fourth = await rateLimit(key, 3, 60_000);
    expect(fourth.success).toBe(false);
    expect(fourth.retryAfterSec).toBeGreaterThan(0);
  });

  it("sayaci VERITABANINDA tutar (ornekler arasi paylasim)", async () => {
    await rateLimit(key, 5, 60_000);
    await rateLimit(key, 5, 60_000);

    const row = await prisma.rateLimit.findUnique({ where: { key } });
    expect(row?.count).toBe(2);
  });

  it("es zamanli istekleri kacirmaz (atomik artirma)", async () => {
    // 10 concurrent requests: with a read-then-write some of them would read the
    // same value and under-count the counter. A single UPSERT counts them all.
    const limit = 4;
    const results = await Promise.all(
      Array.from({ length: 10 }, () => rateLimit(key, limit, 60_000))
    );

    expect(results.filter((r) => r.success)).toHaveLength(limit);
    expect(results.filter((r) => !r.success)).toHaveLength(10 - limit);

    const row = await prisma.rateLimit.findUnique({ where: { key } });
    expect(row?.count).toBe(10);
  });

  it("pencere gecince sifirlanir", async () => {
    // A 1 ms window: after the first request the window is immediately past.
    expect((await rateLimit(key, 1, 1)).success).toBe(true);
    await new Promise((r) => setTimeout(r, 25));
    expect((await rateLimit(key, 1, 1)).success).toBe(true);
  });

  it("suresi gecmis sayaclari temizler", async () => {
    await rateLimit(`${key}-expired`, 1, 1);
    await new Promise((r) => setTimeout(r, 25));

    const removed = await pruneRateLimits();
    expect(removed).toBeGreaterThan(0);
    expect(await prisma.rateLimit.findUnique({ where: { key: `${key}-expired` } })).toBeNull();
  });
});
