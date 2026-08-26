import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

// Postgres RLS izolasyonunu NON-SUPERUSER bir baglantiyla dogrular. Superuser
// RLS'i bypass ettiginden gercek korumayi yalnizca bu rol gosterir. Rol adi
// prisma/rls-app-role.sql'de `ciftlik_app`'tir.
// Yerelde (once: psql "$DIRECT_URL" -v app_pw='dev_app_pw' -f prisma/rls-app-role.sql):
//   RUN_DB_TESTS=1 APP_USER_DATABASE_URL="postgresql://ciftlik_app:dev_app_pw@localhost:5433/ciftlik_pro?schema=public" \
//   npx vitest run src/lib/tenant-rls.int.test.ts
// CI'da `integration` job'i bu iki degiskeni set eder (.github/workflows/ci.yml).
const run = Boolean(process.env.RUN_DB_TESTS);
const APP_URL = process.env.APP_USER_DATABASE_URL;

describe.skipIf(!run || !APP_URL)("RLS izolasyonu (app_user, gercek DB)", () => {
  // PrismaClient'i collection sirasinda degil, suite calisirken olustur; aksi
  // halde APP_URL tanimsizken (skip durumu) constructor patlar.
  let appPrisma: PrismaClient;
  const stamp = Date.now();
  const A = `rls-a-${stamp}`;
  const B = `rls-b-${stamp}`;
  let aId = "";
  let bId = "";
  // Davet: RLS'e alinan son tenant tablosu (20260826120000_invitation_rls).
  const inviteToken = `rls-token-${stamp}`;
  let inviteId = "";

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
    appPrisma = new PrismaClient({ datasources: { db: { url: APP_URL! } } });
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

    const invite = await prisma.invitation.create({
      data: {
        tenantId: A,
        email: `rls-invite-${stamp}@example.com`,
        role: "WORKER",
        token: inviteToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    inviteId = invite.id;
  });

  afterAll(async () => {
    await prisma.invitation.deleteMany({ where: { id: inviteId } });
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

  it("Invitation da RLS altindadir: baglamsiz dogrudan okuma 0 satir dondurur", async () => {
    // Davet, tenantId tasiyan son RLS'siz tabloydu; artik politikaya tabi.
    const none = await appPrisma.invitation.findMany();
    expect(none.length).toBe(0);

    // Token bilinse bile dogrudan sorgu satiri gostermez.
    const direct = await appPrisma.invitation.findUnique({ where: { token: inviteToken } });
    expect(direct).toBeNull();

    // B baglaminda A'nin daveti gorunmez (capraz tenant sizinti yok).
    const cross = await asTenant(B, (tx) => tx.invitation.findMany());
    expect(cross.map((x) => x.id)).not.toContain(inviteId);
  });

  it("public kabul akisi SECURITY DEFINER fonksiyonla calisir (token ile, baglamsiz)", async () => {
    // Kabul akisi oturumsuzdur: app.tenant_id ayarlanamaz. invitation_by_token
    // fonksiyon SAHIBININ yetkisiyle okur; login'deki auth_user_by_email deseni.
    const rows = await appPrisma.$queryRaw<
      Array<{ id: string; tenantId: string; email: string; role: string }>
    >`SELECT * FROM invitation_by_token(${inviteToken})`;

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(inviteId);
    expect(rows[0].tenantId).toBe(A);
    expect(rows[0].role).toBe("WORKER");
    // Fonksiyon token'in kendisini DONDURMEZ.
    expect(rows[0]).not.toHaveProperty("token");

    // Gecersiz token hicbir sey dondurmez (enumerasyona yardim etmez).
    const miss = await appPrisma.$queryRaw<
      Array<{ id: string }>
    >`SELECT * FROM invitation_by_token(${`yok-${stamp}`})`;
    expect(miss).toHaveLength(0);
  });
});
