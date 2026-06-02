import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { DEMO_EMAIL } from "@/lib/authz";

// POST /api/profile/onboarding -> giris yapmis kullanicinin hos geldin turunu
// tamamlandi olarak isaretler (onboardedAt = now). Modulden bagimsiz, kullanicinin
// KENDI kaydina yaptigi bir islem oldugu icin authorizeWrite (RBAC) kullanmaz;
// yalnizca oturum dogrulanir.
//
// Demo hesabi salt-okunurdur: DB'ye yazilmaz ama yine de basarili donulur; boylece
// demo ziyaretci her giriste turu yeniden gorur (vitrin amacli).
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const isDemo = (session.user.email ?? "").toLowerCase() === DEMO_EMAIL;
    if (!isDemo) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { onboardedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding isaretleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/onboarding -> turu sifirlar (onboardedAt = null), boylece
// kullanici hos geldin turunu yeniden gorebilir. Demo hesabi zaten her zaman
// turu gordugu icin DB'ye yazmaz; yine de basarili donulur.
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const isDemo = (session.user.email ?? "").toLowerCase() === DEMO_EMAIL;
    if (!isDemo) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { onboardedAt: null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding sifirlama hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
