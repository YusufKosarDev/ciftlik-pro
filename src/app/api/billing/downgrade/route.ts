import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { isDemoUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";

// POST /api/billing/downgrade -> an ADMIN drops the tenant back to FREE.
// It applies only in DEMO mode, with no real Stripe configured; cancelling a real
// subscription happens in Stripe's customer portal, which is out of scope here.
export async function POST() {
  const te = await getTranslations("Errors");
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: te("adminOnlyChangePlan") }, { status: 403 });
  }
  // The demo account is read-only: even the showcase ADMIN cannot make a real plan
  // change.
  if (isDemoUser(session.user.email)) {
    return NextResponse.json(
      { error: te("demoPlanLocked") },
      { status: 403 }
    );
  }

  const stripeEnabled = Boolean(getStripe() && process.env.STRIPE_PRO_PRICE_ID);
  if (stripeEnabled) {
    return NextResponse.json(
      { error: te("manageInStripePortal") },
      { status: 400 }
    );
  }

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { plan: "FREE" },
  });
  await logAudit(
    session.user,
    "UPDATE",
    "Tenant",
    session.user.tenantId,
    "plan: PRO → FREE"
  );
  return NextResponse.json({ ok: true });
}
