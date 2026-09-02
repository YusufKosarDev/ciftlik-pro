import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

// Verifies Postgres RLS isolation over a NON-SUPERUSER connection. A superuser
// bypasses RLS, so only this role demonstrates the real protection. The role is
// named `ciftlik_app` in prisma/rls-app-role.sql.
// Locally (first: psql "$DIRECT_URL" -v app_pw='dev_app_pw' -f prisma/rls-app-role.sql):
//   RUN_DB_TESTS=1 APP_USER_DATABASE_URL="postgresql://ciftlik_app:dev_app_pw@localhost:5433/ciftlik_pro?schema=public" \
//   npx vitest run src/lib/tenant-rls.int.test.ts
// In CI the `integration` job sets both variables (.github/workflows/ci.yml).
const run = Boolean(process.env.RUN_DB_TESTS);
const APP_URL = process.env.APP_USER_DATABASE_URL;

describe.skipIf(!run || !APP_URL)("RLS izolasyonu (app_user, gercek DB)", () => {
  // Construct the PrismaClient when the suite runs, not during collection;
  // otherwise the constructor throws while APP_URL is undefined (the skip case).
  let appPrisma: PrismaClient;
  const stamp = Date.now();
  const A = `rls-a-${stamp}`;
  const B = `rls-b-${stamp}`;
  let aId = "";
  let bId = "";
  // Invitation: the last tenant table brought under RLS
  // (20260826120000_invitation_rls).
  const inviteToken = `rls-token-${stamp}`;
  let inviteId = "";
  // Order: belongs to B, so it must be neither readable nor writable from A's
  // context.
  let bOrderId = "";
  // Storefront: A has an ACTIVE product (so it enters the directory) and B has only
  // an INACTIVE one (so it does not) — this exercises the active filter in
  // public_storefront_tenants.
  let aProductId = "";
  let bProductId = "";

  // Runs in the given tenant's context (SET LOCAL app.tenant_id).
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
    // Setup runs as the SUPERUSER (bypassing RLS): two tenants, with one animal
    // each.
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

    const bOrder = await prisma.order.create({
      data: { tenantId: B, customerName: `RLS B Musteri ${stamp}`, total: 100 },
    });
    bOrderId = bOrder.id;

    const aProduct = await prisma.product.create({
      data: { tenantId: A, name: `RLS A Urun ${stamp}`, price: 10, active: true },
    });
    aProductId = aProduct.id;
    const bProduct = await prisma.product.create({
      data: { tenantId: B, name: `RLS B Pasif Urun ${stamp}`, price: 20, active: false },
    });
    bProductId = bProduct.id;
  });

  afterAll(async () => {
    await prisma.invitation.deleteMany({ where: { id: inviteId } });
    await prisma.order.deleteMany({ where: { id: bOrderId } });
    await prisma.product.deleteMany({ where: { id: { in: [aProductId, bProductId] } } });
    await prisma.animal.deleteMany({ where: { id: { in: [aId, bId] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [A, B] } } });
    await appPrisma.$disconnect();
    await prisma.$disconnect();
  });

  it("baglam tenant'i disindaki satirlar gizlenir (findMany + findUnique sizinti yok)", async () => {
    const aSees = await asTenant(A, (tx) => tx.animal.findMany());
    expect(aSees.map((x) => x.id)).toContain(aId);
    expect(aSees.map((x) => x.id)).not.toContain(bId);

    // findUnique by id for B's record while in A's context -> RLS hides it -> null
    // (NO LEAK)
    const leak = await asTenant(A, (tx) => tx.animal.findUnique({ where: { id: bId } }));
    expect(leak).toBeNull();

    const bSees = await asTenant(B, (tx) => tx.animal.findMany());
    expect(bSees.map((x) => x.id)).toContain(bId);
    expect(bSees.map((x) => x.id)).not.toContain(aId);
  });

  it("baglam ayarli degilse hicbir satir gorunmez (fail-closed)", async () => {
    // With app.tenant_id unset -> current_setting is NULL -> 0 rows.
    const none = await appPrisma.animal.findMany();
    expect(none.length).toBe(0);
  });

  it("Invitation da RLS altindadir: baglamsiz dogrudan okuma 0 satir dondurur", async () => {
    // Invitation was the last table carrying a tenantId without RLS; it is now
    // subject to the policy.
    const none = await appPrisma.invitation.findMany();
    expect(none.length).toBe(0);

    // Even knowing the token, a direct query does not reveal the row.
    const direct = await appPrisma.invitation.findUnique({ where: { token: inviteToken } });
    expect(direct).toBeNull();

    // A's invitation is invisible from B's context (no cross-tenant leak).
    const cross = await asTenant(B, (tx) => tx.invitation.findMany());
    expect(cross.map((x) => x.id)).not.toContain(inviteId);
  });

  it("public kabul akisi SECURITY DEFINER fonksiyonla calisir (token ile, baglamsiz)", async () => {
    // The acceptance flow has no session, so app.tenant_id cannot be set.
    // invitation_by_token reads with the function OWNER's privileges — the same
    // pattern as auth_user_by_email at sign-in.
    const rows = await appPrisma.$queryRaw<
      Array<{ id: string; tenantId: string; email: string; role: string }>
    >`SELECT * FROM invitation_by_token(${inviteToken})`;

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(inviteId);
    expect(rows[0].tenantId).toBe(A);
    expect(rows[0].role).toBe("WORKER");
    // The function DOES NOT return the token itself.
    expect(rows[0]).not.toHaveProperty("token");

    // An invalid token returns nothing (it does not help enumeration).
    const miss = await appPrisma.$queryRaw<
      Array<{ id: string }>
    >`SELECT * FROM invitation_by_token(${`yok-${stamp}`})`;
    expect(miss).toHaveLength(0);
  });

  it("baska tenant'in siparisi PATCH/DELETE edilemez", async () => {
    // src/app/api/orders/[id]/route.ts looks the record up with findFirst first; if
    // B's order is invisible from A's context, the endpoint answers 404.
    const notVisible = await asTenant(A, (tx) => tx.order.findFirst({ where: { id: bOrderId } }));
    expect(notVisible).toBeNull();

    // Even with the guard removed the write stops at the database level: RLS hides
    // the row, so updateMany and deleteMany affect 0 rows. They do not throw, which
    // is why the count can be measured directly.
    const updated = await asTenant(A, (tx) =>
      tx.order.updateMany({ where: { id: bOrderId }, data: { status: "CANCELLED" } })
    );
    expect(updated.count).toBe(0);

    const deleted = await asTenant(A, (tx) => tx.order.deleteMany({ where: { id: bOrderId } }));
    expect(deleted.count).toBe(0);

    // It is unreachable with no context set at all — fail-closed.
    const noContext = await appPrisma.order.findFirst({ where: { id: bOrderId } });
    expect(noContext).toBeNull();

    // The record is still there: confirm it over the superuser connection.
    const still = await prisma.order.findUnique({ where: { id: bOrderId } });
    expect(still).not.toBeNull();
    expect(still!.status).toBe("PENDING");

    // Its own tenant (B) can of course see and update it.
    const own = await asTenant(B, (tx) => tx.order.findFirst({ where: { id: bOrderId } }));
    expect(own?.id).toBe(bOrderId);
  });

  it("public_storefront_tenants() baglamsiz cagrildiginda dolu doner", async () => {
    // First show RLS really is on: a direct read with no context comes back empty.
    const direct = await appPrisma.product.findMany();
    expect(direct.length).toBe(0);

    // The function reads with its OWNER's privileges; the storefront directory runs
    // without a session.
    const rows = await appPrisma.$queryRaw<
      Array<{ id: string; name: string; slug: string }>
    >`SELECT * FROM public_storefront_tenants()`;

    const ids = rows.map((r) => r.id);
    // A has an ACTIVE product -> it is in the directory.
    expect(ids).toContain(A);
    // B has only an INACTIVE product -> it is NOT in the directory.
    expect(ids).not.toContain(B);

    // No product detail leaks: the returned row carries only the storefront's
    // identity.
    const a = rows.find((r) => r.id === A)!;
    expect(Object.keys(a).sort()).toEqual(["id", "name", "slug"]);
    expect(a.name).toBe("RLS A");
  });
});
