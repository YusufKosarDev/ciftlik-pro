import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant-prisma";
import { collectAlerts, renderAlertsHtml, VACCINATION_WINDOW_DAYS } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { pruneRateLimits } from "@/lib/rate-limit";

// GET /api/cron/alerts
// Gunluk cron tarafindan cagrilir (Vercel Cron). Kritik stok, geciken gorev ve
// yaklasan asilari toplayip ADMIN'lere e-posta gonderir.
//
// Guvenlik: CRON_SECRET tanimliysa "Authorization: Bearer <CRON_SECRET>" baslik
// dogrulanir. (Vercel Cron, CRON_SECRET tanimliysa bu basligi otomatik ekler.)
export async function GET(request: Request) {
  const te = await getTranslations("Errors");
  const secret = process.env.CRON_SECRET;

  // CRON_SECRET tanimli degilse endpoint'i hicbir zaman acik birakmayiz.
  // 503 (Service Unavailable) doneriz: bu bir sunucu COKMESI degil, eksik
  // yapilandirmadir — Stripe webhook'undaki desenle ayni — ve boylece izleme
  // alarmlarini 5xx hata orani olarak gereksiz tetiklemez.
  if (!secret) {
    console.error("CRON_SECRET ortam degiskeni tanimli degil. Endpoint devre disi.");
    return NextResponse.json(
      { error: te("cronSecretMissing") },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
  }

  try {
    // Bakim: suresi gecmis hiz siniri sayaclarini temizle (tablo sinirsiz
    // buyumesin). Uyari gonderiminden bagimsizdir; hata durumunda 0 doner.
    const prunedRateLimits = await pruneRateLimits();

    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + VACCINATION_WINDOW_DAYS);

    // Cok-kiracilik: her tenant'in uyarilari kendi verisiyle toplanir ve yalnizca
    // o tenant'in ADMIN'lerine gonderilir. Tenant listesi RLS'siz okunur; her
    // tenant icin sorgular withTenant baglaminda calisir.
    const tenants = await prisma.tenant.findMany({ select: { id: true } });

    const results = await Promise.all(
      tenants.map(async (tenant) => {
        const [inventory, tasks, vaccinations, admins] = await withTenant(tenant.id, (db) =>
          Promise.all([
            db.$queryRaw<Array<{ name: string; quantity: number; criticalLevel: number; unit: string }>>`
              SELECT name, quantity, "criticalLevel", unit
              FROM "InventoryItem"
              WHERE quantity <= "criticalLevel"
            `,
            db.task.findMany({
              where: { status: { not: "DONE" }, dueDate: { lt: now } },
              select: { title: true, status: true, dueDate: true },
            }),
            db.vaccination.findMany({
              where: { nextDate: { gte: now, lte: windowEnd } },
              select: {
                name: true,
                nextDate: true,
                animal: { select: { tagNumber: true, name: true } },
              },
            }),
            db.user.findMany({ where: { role: "ADMIN" }, select: { email: true } }),
          ])
        );

        const alerts = collectAlerts({ inventory, tasks, vaccinations }, now);
        if (alerts.total === 0) return null;

        const recipients = admins.map((a) => a.email);
        if (recipients.length === 0) return null;

        await sendEmail(
          recipients,
          `Çiftlik Pro — ${alerts.total} uyarı`,
          renderAlertsHtml(alerts)
        );

        return {
          alertsCount: alerts.total,
          recipientsCount: recipients.length,
        };
      })
    );

    let tenantsNotified = 0;
    let totalAlerts = 0;
    let totalRecipients = 0;

    for (const res of results) {
      if (res) {
        tenantsNotified += 1;
        totalAlerts += res.alertsCount;
        totalRecipients += res.recipientsCount;
      }
    }

    return NextResponse.json({
      ok: true,
      tenants: tenants.length,
      tenantsNotified,
      total: totalAlerts,
      recipients: totalRecipients,
      prunedRateLimits,
    });
  } catch (error) {
    console.error("Cron uyari hatasi:", error);
    return NextResponse.json({ error: te("serverError") }, { status: 500 });
  }
}
