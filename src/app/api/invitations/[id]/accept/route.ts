import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canAddRecord } from "@/lib/plan";
import { acceptInviteSchema } from "@/lib/validations/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password-hash";
import { findInvitationByToken, isInvitationUsable } from "@/lib/invitations";
import { logAudit } from "@/lib/audit";

// POST /api/invitations/[id]/accept -> PUBLIC invitation acceptance.
// The invitee sets their own name and password and is added to the tenant as a
// user. Invitation is under RLS, and there is no session or tenant context here,
// so the token lookup goes through the SECURITY DEFINER function
// `invitation_by_token` (see src/lib/invitations.ts).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
  try {
    const rl = await rateLimit(`accept:${clientIp(request)}`, 10, 5 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: te("rateLimited") },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const { id: token } = await params;
    const body = await request.json();
    const parsed = acceptInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const invitation = await findInvitationByToken(token);
    if (!isInvitationUsable(invitation)) {
      return NextResponse.json(
        { error: te("invitationInvalid") },
        { status: 410 }
      );
    }

    // Plan limit — it may have filled up since the invitation was sent. A hard
    // block.
    const limit = await canAddRecord(invitation.tenantId, "users");
    if (!limit.allowed) {
      return NextResponse.json(
        { error: te("staffLimitReached") },
        { status: 403 }
      );
    }

    const { name, password } = parsed.data;
    const passwordHash = await hashPassword(password);

    try {
      await prisma.$transaction(async (tx) => {
        // Establish the tenant context (for User's RLS WITH CHECK), then write the
        // user.
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${invitation.tenantId}, true)`;
        await tx.user.create({
          data: {
            tenantId: invitation.tenantId,
            name,
            email: invitation.email,
            password: passwordHash,
            role: invitation.role,
            onboardedAt: new Date(), // davetli "mevcut" sayilir; tur gosterilmez
          },
        });
        // The invitation is single-use: mark it accepted.
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        });
      });
    } catch (err) {
      // Email is globally unique: P2002 if they registered elsewhere in the
      // meantime.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json(
          { error: te("emailTakenSignIn") },
          { status: 409 }
        );
      }
      throw err;
    }

    await logAudit(
      { email: invitation.email, tenantId: invitation.tenantId },
      "CREATE",
      "User",
      invitation.email,
      `davet kabul (${invitation.role})`
    );

    return NextResponse.json({ ok: true, email: invitation.email }, { status: 201 });
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
