import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { isDemoUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";

// POST /api/billing/downgrade -> ADMIN, tenant'ı FREE'ye düşürür.
// Yalnızca DEMO modunda (gerçek Stripe yapılandırılmamışken) geçerlidir; gerçek
// abonelikte iptal, Stripe müşteri portalından yapılır (kapsam dışı).
export async function POST() {
  const te = await getTranslations("Errors");
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: te("adminOnlyChangePlan") }, { status: 403 });
  }
  // Demo hesabi salt-okunurdur: vitrin ADMIN olsa da gercek plan degisikligi yaptiramaz.
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
