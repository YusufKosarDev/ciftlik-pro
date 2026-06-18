import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// POST /api/billing/downgrade -> ADMIN, tenant'ı FREE'ye düşürür.
// Yalnızca DEMO modunda (gerçek Stripe yapılandırılmamışken) geçerlidir; gerçek
// abonelikte iptal, Stripe müşteri portalından yapılır (kapsam dışı).
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yalnızca yönetici planı değiştirebilir" }, { status: 403 });
  }

  const stripeEnabled = Boolean(getStripe() && process.env.STRIPE_PRO_PRICE_ID);
  if (stripeEnabled) {
    return NextResponse.json(
      { error: "Aboneliğinizi Stripe müşteri portalından yönetin" },
      { status: 400 }
    );
  }

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { plan: "FREE" },
  });
  return NextResponse.json({ ok: true });
}
