import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant-prisma";
import { collectAlerts, renderAlertsHtml, VACCINATION_WINDOW_DAYS } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { pruneRateLimits } from "@/lib/rate-limit";

// GET /api/cron/alerts
// Called by the daily cron (Vercel Cron). Gathers critical stock, overdue tasks
// and upcoming vaccinations, then emails the administrators.
//
// Security: when CRON_SECRET is set, the "Authorization: Bearer <CRON_SECRET>"
// header is verified. (Vercel Cron adds that header automatically when
// CRON_SECRET is set.)
export async function GET(request: Request) {
  const te = await getTranslations("Errors");
  const secret = process.env.CRON_SECRET;

  // With no CRON_SECRET the endpoint is never left open.
  // It answers 503 (Service Unavailable): this is not a server CRASH but missing
  // configuration — the same pattern the Stripe webhook uses — so it does not
  // needlessly trip monitoring alerts as a 5xx error rate.
  if (!secret) {
    console.error("CRON_SECRET is not set. The endpoint is disabled.");
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
    // Maintenance: clear expired rate limit counters so the table does not grow
    // without bound. Independent of the alert sending; it returns 0 on failure.
    const prunedRateLimits = await pruneRateLimits();

    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + VACCINATION_WINDOW_DAYS);

    // Multi-tenancy: each tenant's alerts are gathered from its own data and sent
    // only to that tenant's administrators. The tenant list is read outside RLS;
    // the per-tenant queries run inside a withTenant context.
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
    console.error("Cron alert run failed:", error);
    return NextResponse.json({ error: te("serverError") }, { status: 500 });
  }
}
