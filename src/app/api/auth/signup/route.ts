import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signupSchema, slugify } from "@/lib/validations/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password-hash";
import { logAudit } from "@/lib/audit";

// POST /api/auth/signup
// The PUBLIC "create a farm" sign-up: creates a new Tenant plus the first ADMIN
// (the owner) in one transaction. It needs no identity; a rate limit applies.
//
// RLS compatibility: the Tenant table is outside RLS, so that insert is free. The
// User insert, however, is subject to the WITH CHECK policy — which is why
// app.tenant_id is set in the same transaction AFTER the tenant is created, and
// only then is the ADMIN written. That makes it work under the non-superuser role
// in production too.
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  try {
    // Against abuse and bot sign-ups: at most 5 registrations per IP in 5 minutes.
    const rl = await rateLimit(`signup:${clientIp(request)}`, 5, 5 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: te("rateLimited") },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { farmName, name, email, password } = parsed.data;
    const passwordHash = await hashPassword(password);
    const base = slugify(farmName) || "ciftlik";

    let result: { tenantId: string; userId: string };
    try {
      result = await prisma.$transaction(async (tx) => {
        // Find a unique slug: base, base-2, base-3, ...
        let slug = base;
        for (let n = 2; await tx.tenant.findUnique({ where: { slug } }); n++) {
          slug = `${base}-${n}`;
        }
        const tenant = await tx.tenant.create({ data: { name: farmName, slug } });

        // Establish the new tenant's context (for the RLS WITH CHECK), then write
        // the ADMIN.
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenant.id}, true)`;
        const user = await tx.user.create({
          // onboardedAt is empty: the new owner sees the welcome tour.
          data: { tenantId: tenant.id, name, email, password: passwordHash, role: "ADMIN" },
        });
        return { tenantId: tenant.id, userId: user.id };
      });
    } catch (err) {
      // Email is globally unique: P2002 if it is already registered in another
      // tenant.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json(
          { error: te("emailTaken") },
          { status: 409 }
        );
      }
      throw err;
    }

    await logAudit(
      { id: result.userId, name, email, tenantId: result.tenantId },
      "CREATE",
      "Tenant",
      result.tenantId,
      farmName
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Farm sign-up failed:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
