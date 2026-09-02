import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@prisma/client";
import { withTenant } from "@/lib/tenant-prisma";
import { canAddRecord } from "@/lib/plan";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { registerSchema } from "@/lib/validations/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password-hash";

// POST /api/auth/register
// Creates a new user account (ADMIN only).
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  try {
    // 0) Only an ADMIN may create a user
    const authz = await authorizeWrite("users");
    if ("error" in authz) return authz.error;

    // Rate limit: at most 10 registrations per IP in 5 minutes, to prevent
    // accidental or malicious bulk creation.
    const rl = await rateLimit(`register:${clientIp(request)}`, 10, 5 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: te("rateLimited") },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await request.json();

    // 1) Validate the incoming data
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;
    const tenantId = authz.session.user.tenantId;

    // Plan limit (FREE: at most 3 staff members). A hard block.
    const limit = await canAddRecord(tenantId, "users");
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: te("planLimitStaff", { limit: limit.limit }),
          code: "PLAN_LIMIT",
        },
        { status: 403 }
      );
    }

    // 2) Is the email already registered? (within the active tenant)
    const existing = await withTenant(tenantId, (db) =>
      db.user.findFirst({ where: { email } })
    );
    if (existing) {
      return NextResponse.json(
        { error: te("emailTaken") },
        { status: 409 }
      );
    }

    // 3) Hash the password (plaintext is never stored)
    const passwordHash = await hashPassword(password);

    // 4) Create the user. They are attached to the tenant of the ADMIN creating
    // the record (tenantId is explicit; withTenant establishes the RLS context).
    let user;
    try {
      user = await withTenant(tenantId, (db) =>
        db.user.create({
          data: { tenantId, name, email, password: passwordHash, role },
          // The password is never returned
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        })
      );
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

    await logAudit(authz.session.user, "CREATE", "User", user.id, user.email);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("User registration failed:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
