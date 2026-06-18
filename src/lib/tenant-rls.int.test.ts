import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

// Postgres RLS izolasyonunu NON-SUPERUSER (app_user) bir baglantiyla dogrular.
// Superuser RLS'i bypass ettiginden gercek korumayi yalnizca app_user gosterir.
// Yerelde:
//   RUN_DB_TESTS=1 APP_USER_DATABASE_URL="postgresql://app_user:app_pw@localhost:5433/ciftlik_pro?schema=public" \
//   npx vitest run src/lib/tenant-rls.int.test.ts
const run = Boolean(process.env.RUN_DB_TESTS);
const APP_URL = process.env.APP_USER_DATABASE_URL;

describe.skipIf(!run || !APP_URL)("RLS izolasyonu (app_user, gercek DB)", () => {
  const appPrisma = new PrismaClient({ datasources: { db: { url: APP_URL! } } });
  const stamp = Date.now();
  const A = `rls-a-${stamp}`;
  const B = `rls-b-${stamp}`;
  let aId = "";
  let bId = "";

  // Verilen tenant baglaminda (SET LOCAL app.tenant_id) calistirir.
  async function asTenant<T>(
    tid: string,
    fn: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
  ): Promise<T> {
    return appPrisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tid}, true)`;
      return fn(tx);
    });
  }

  beforeAll(async () => {
    // Kurulum SUPERUSER ile (RLS bypass) — iki tenant + ikisine birer hayvan.
    await prisma.tenant.createMany({
      data: [
        { id: A, name: "RLS A", slug: `rls-a-${stamp}` },
        { id: B, name: "RLS B", slug: `rls-b-${stamp}` },
      ],
    });
    const a = await prisma.animal.create({
      data: { tenantId: A, tagNumber: `RLS-A-${stamp}`, species: "CATTLE", gender: "FEMALE" },
    });
    const b = await prisma.animal.create({
      data: { tenantId: B, tagNumber: `RLS-B-${stamp}`, species: "SHEEP", gender: "FEMALE" },
    });
    aId = a.id;
    bId = b.id;
  });

  afterAll(async () => {
    await prisma.animal.deleteMany({ where: { id: { in: [aId, bId] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [A, B] } } });
    await appPrisma.$disconnect();
    await prisma.$disconnect();
  });

  it("baglam tenant'i disindaki satirlar gizlenir (findMany + findUnique sizinti yok)", async () => {
    const aSees = await asTenant(A, (tx) => tx.animal.findMany());
    expect(aSees.map((x) => x.id)).toContain(aId);
    expect(aSees.map((x) => x.id)).not.toContain(bId);

    // A baglaminda B'nin kaydini id ile findUnique → RLS gizler → null (SIZINTI YOK)
    const leak = await asTenant(A, (tx) => tx.animal.findUnique({ where: { id: bId } }));
    expect(leak).toBeNull();

    const bSees = await asTenant(B, (tx) => tx.animal.findMany());
    expect(bSees.map((x) => x.id)).toContain(bId);
    expect(bSees.map((x) => x.id)).not.toContain(aId);
  });

  it("baglam ayarli degilse hicbir satir gorunmez (fail-closed)", async () => {
    // app.tenant_id set edilmeden → current_setting NULL → 0 satir.
    const none = await appPrisma.animal.findMany();
    expect(none.length).toBe(0);
  });
});
