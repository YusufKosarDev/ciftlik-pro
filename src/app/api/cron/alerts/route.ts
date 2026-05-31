import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectAlerts, renderAlertsHtml, VACCINATION_WINDOW_DAYS } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

// GET /api/cron/alerts
// Gunluk cron tarafindan cagrilir (Vercel Cron). Kritik stok, geciken gorev ve
// yaklasan asilari toplayip ADMIN'lere e-posta gonderir.
//
// Guvenlik: CRON_SECRET tanimliysa "Authorization: Bearer <CRON_SECRET>" baslik
// dogrulanir. (Vercel Cron, CRON_SECRET tanimliysa bu basligi otomatik ekler.)
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + VACCINATION_WINDOW_DAYS);

    const [inventory, tasks, vaccinations, admins] = await Promise.all([
      prisma.inventoryItem.findMany({
        select: { name: true, quantity: true, criticalLevel: true, unit: true },
      }),
      prisma.task.findMany({
        where: { status: { not: "DONE" }, dueDate: { lt: now } },
        select: { title: true, status: true, dueDate: true },
      }),
      prisma.vaccination.findMany({
        where: { nextDate: { gte: now, lte: windowEnd } },
        select: {
          name: true,
          nextDate: true,
          animal: { select: { tagNumber: true, name: true } },
        },
      }),
      prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } }),
    ]);

    const alerts = collectAlerts({ inventory, tasks, vaccinations }, now);

    if (alerts.total === 0) {
      return NextResponse.json({ ok: true, sent: false, total: 0 });
    }

    const recipients = admins.map((a) => a.email);
    const result = await sendEmail(
      recipients,
      `Çiftlik Pro — ${alerts.total} uyarı`,
      renderAlertsHtml(alerts)
    );

    return NextResponse.json({
      ok: true,
      sent: !result.skipped,
      total: alerts.total,
      recipients: recipients.length,
    });
  } catch (error) {
    console.error("Cron uyari hatasi:", error);
    return NextResponse.json({ error: "Sunucu hatasi" }, { status: 500 });
  }
}
