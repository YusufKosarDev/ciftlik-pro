import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { randomBytes } from "crypto";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { canAddRecord } from "@/lib/plan";
import { logAudit } from "@/lib/audit";
import { inviteSchema } from "@/lib/validations/auth";
import { sendEmail } from "@/lib/email";

const INVITE_TTL_DAYS = 7;

// POST /api/invitations -> an ADMIN creates a staff invitation within the tenant.
// The invitee sets their name and password through the returned token link
// (/davet/<token>).
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("users");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;
    const tenantId = authz.session.user.tenantId;

    // Plan limit (FREE: at most 3 staff). When it is full, no invitation is sent
    // either.
    const limit = await canAddRecord(tenantId, "users");
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: te("planLimitInvite", { limit: limit.limit }),
          code: "PLAN_LIMIT",
        },
        { status: 403 }
      );
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const result = await withTenant(tenantId, async (db) => {
      // Are they already a member of this tenant?
      const existingUser = await db.user.findFirst({ where: { email } });
      if (existingUser) return { conflict: true } as const;

      // If a pending invitation for the same email exists, replace it with the new
      // one (re-invite).
      await db.invitation.deleteMany({ where: { email, acceptedAt: null } });
      const invitation = await db.invitation.create({
        data: { tenantId, email, role, token, invitedById: authz.session.user.id, expiresAt },
      });
      return { invitation } as const;
    });

    if ("conflict" in result) {
      return NextResponse.json(
        { error: te("emailAlreadyInTeam") },
        { status: 409 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const acceptUrl = `${origin}/davet/${token}`;

    // Send the invitation when email is configured (best-effort; otherwise the
    // link is shown in the UI).
    // The language is the one chosen by the administrator CREATING the invitation:
    // we do not know the invitee's language, but they will work on the same team.
    // (The daily digest email is different: the cron has no viewer whose language
    // to read, so that one stays Turkish.)
    const ti = await getTranslations("Invite");
    await sendEmail(
      [email],
      ti("emailSubject"),
      `<p>${ti("emailIntro")}</p>
       <p><a href="${acceptUrl}">${acceptUrl}</a></p>
       <p>${ti("emailExpiry", { days: INVITE_TTL_DAYS })}</p>`
    );

    await logAudit(authz.session.user, "CREATE", "Invitation", result.invitation.id, email);

    return NextResponse.json({ ok: true, acceptUrl, expiresAt }, { status: 201 });
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
