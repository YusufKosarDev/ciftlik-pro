import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { auditActionLabels } from "@/lib/labels";
import type { AuditAction } from "@prisma/client";

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("tr-TR");
}

const actionTone: Record<AuditAction, "green" | "blue" | "red" | "yellow"> = {
  CREATE: "green",
  UPDATE: "blue",
  DELETE: "red",
  LOGIN_FAILED: "yellow",
};

export default async function DenetimPage() {
  const session = await auth();
  // Yalnizca ADMIN denetim gunlugunu gorebilir.
  if (session?.user.role !== "ADMIN") {
    redirect("/panel");
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <span>🧾</span> Denetim Günlüğü
        </h1>
        <p className="text-sm text-muted-foreground">Son {logs.length} işlem (en yeni 100)</p>
      </div>

      {logs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          Henuz kayit yok.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium">Kullanıcı</th>
                <th className="px-4 py-3 font-medium">İşlem</th>
                <th className="px-4 py-3 font-medium">Varlık</th>
                <th className="px-4 py-3 font-medium">Özet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-muted">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(l.createdAt)}
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
