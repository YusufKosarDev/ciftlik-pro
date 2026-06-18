import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "./prisma";
import { forTenant } from "./tenant-prisma";

// Gercek DB gerektirir; CI birim isinde DB olmadigindan RUN_DB_TESTS ile gatelenir.
// Yerelde: RUN_DB_TESTS=1 npx vitest run src/lib/tenant-prisma.int.test.ts
const run = Boolean(process.env.RUN_DB_TESTS);

describe.skipIf(!run)("tenant izolasyonu (integration, gercek DB)", () => {
  const stamp = Date.now();
  const A = `t-a-${stamp}`;
  const B = `t-b-${stamp}`;
  const tagA = `ISO-A-${stamp}`;
  const tagB = `ISO-B-${stamp}`;

  beforeAll(async () => {
    await prisma.tenant.createMany({
      data: [
        { id: A, name: "Tenant A", slug: `a-${stamp}` },
        { id: B, name: "Tenant B", slug: `b-${stamp}` },
      ],
    });
  });

  afterAll(async () => {
    await prisma.animal.deleteMany({ where: { tagNumber: { in: [tagA, tagB] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [A, B] } } });
    await prisma.$disconnect();
  });

  it("create otomatik tenantId atar ve findMany/count yalnız kendi tenant'ını döner", async () => {
    const dbA = forTenant(A);
    const dbB = forTenant(B);

    const aAnimal = await dbA.animal.create({
      data: { tagNumber: tagA, species: "CATTLE", gender: "FEMALE" },
    });
    const bAnimal = await dbB.animal.create({
      data: { tagNumber: tagB, species: "SHEEP", gender: "FEMALE" },
    });

    // create otomatik tenantId atadı
    expect(aAnimal.tenantId).toBe(A);
    expect(bAnimal.tenantId).toBe(B);

    // findMany sadece kendi tenant'ının kaydını görür (izolasyon)
    const aList = await dbA.animal.findMany({
      where: { tagNumber: { in: [tagA, tagB] } },
    });
    const bList = await dbB.animal.findMany({
      where: { tagNumber: { in: [tagA, tagB] } },
    });
    expect(aList.map((x) => x.tagNumber)).toEqual([tagA]);
    expect(bList.map((x) => x.tagNumber)).toEqual([tagB]);

    // count da kapsanır
    expect(
      await dbA.animal.count({ where: { tagNumber: { in: [tagA, tagB] } } })
    ).toBe(1);
    expect(
      await dbB.animal.count({ where: { tagNumber: { in: [tagA, tagB] } } })
    ).toBe(1);
  });

  it("ayni kulak numarasi farkli tenant'larda kullanilabilir (per-tenant unique)", async () => {
    const shared = `SHARED-${stamp}`;
    try {
      const a = await forTenant(A).animal.create({
        data: { tagNumber: shared, species: "CATTLE", gender: "FEMALE" },
      });
      const b = await forTenant(B).animal.create({
        data: { tagNumber: shared, species: "GOAT", gender: "FEMALE" },
      });
      expect(a.tenantId).toBe(A);
      expect(b.tenantId).toBe(B);
      expect(a.id).not.toBe(b.id);
    } finally {
      await prisma.animal.deleteMany({ where: { tagNumber: shared } });
    }
  });
});
