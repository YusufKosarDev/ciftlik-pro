import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { auth } from "@/lib/auth";
import { isDemoUser } from "@/lib/authz";

// POST /api/profile/onboarding -> marks the signed-in user's welcome tour as
// completed (onboardedAt = now). It does not use authorizeWrite (RBAC), because
// this is module-independent and something the user does to their OWN record; only
// the session is verified.
//
// The demo account is read-only: nothing is written to the database, but the call
// still succeeds — so a demo visitor sees the tour again on every sign-in, which is
// the point of a showcase.
export async function POST() {
  const te = await getTranslations("Errors");
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
    }

    const isDemo = isDemoUser(session.user.email);
    if (!isDemo) {
      await withTenant(session.user.tenantId, (db) =>
        db.user.update({
          where: { id: session.user.id },
          data: { onboardedAt: new Date() },
        })
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark onboarding complete:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/onboarding -> resets the tour (onboardedAt = null) so the
// user can see the welcome tour again. The demo account always sees the tour
// anyway, so nothing is written for it; the call still succeeds.
export async function DELETE() {
  const te = await getTranslations("Errors");
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
    }

    const isDemo = isDemoUser(session.user.email);
    if (!isDemo) {
      await withTenant(session.user.tenantId, (db) =>
        db.user.update({
          where: { id: session.user.id },
          data: { onboardedAt: null },
        })
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reset onboarding:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
