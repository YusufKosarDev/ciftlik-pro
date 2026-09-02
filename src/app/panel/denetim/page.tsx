import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-prisma";
import { Badge } from "@/components/ui/badge";
import { getLabels } from "@/lib/get-labels";
import type { AuditAction } from "@prisma/client";

// The audit log shows date and time; the format follows the active locale.
function formatDateTime(date: Date, locale: string): string {
  return new Date(date).toLocaleString(locale === "tr" ? "tr-TR" : "en-US");
}

const actionTone: Record<AuditAction, "green" | "blue" | "red" | "yellow"> = {
  CREATE: "green",
  UPDATE: "blue",
  DELETE: "red",
  LOGIN_FAILED: "yellow",
};

export default async function DenetimPage() {
  const [session, t, tc, locale, { auditActionLabels }] = await Promise.all([
    auth(),
    getTranslations("Audit"),
    getTranslations("Common"),
    getLocale(),
    getLabels(),
  ]);
  // Only an ADMIN may see the audit log.
  if (session?.user.role !== "ADMIN") {
    redirect("/panel");
  }

  const logs = await withTenant(session!.user.tenantId, (db) =>
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <span>🧾</span> {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">Son {logs.length} işlem (en yeni 100)</p>
      </div>

      {logs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{tc("date")}</th>
                <th className="px-4 py-3 font-medium">{t("actorName")}</th>
                <th className="px-4 py-3 font-medium">{t("action")}</th>
                <th className="px-4 py-3 font-medium">{t("entity")}</th>
                <th className="px-4 py-3 font-medium">{t("summary")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-muted">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(l.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3 text-foreground">{l.actorName}</td>
                  <td className="px-4 py-3">
                    <Badge tone={actionTone[l.action]}>{auditActionLabels[l.action]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground">{l.entity}</td>
                  <td className="px-4 py-3 text-foreground">{l.summary ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
