import { withTenant } from "@/lib/tenant-prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { FeedForm } from "@/components/feed-form";
import { DeleteButton } from "@/components/delete-button";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("tr-TR");
}

export default async function YemPage() {
  const session = await auth();
  const [feedItems, logs] = await withTenant(session!.user.tenantId, (db) =>
    Promise.all([
      db.inventoryItem.findMany({
        where: { category: "FEED" },
        orderBy: { name: "asc" },
      }),
      db.feedLog.findMany({
        orderBy: { date: "desc" },
        take: 50,
        include: { inventoryItem: { select: { name: true, unit: true } } },
      }),
    ])
  );

  const canEdit = session ? canWrite(session.user.role, "inventory") : false;

  const criticalCount = feedItems.filter((i) => i.quantity <= i.criticalLevel).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <span>🌾</span> Yem Yönetimi
        </h1>
        <p className="text-sm text-muted-foreground">
          {feedItems.length} yem kalemi
          {criticalCount > 0 && (
            <span className="ml-2 text-red-600">· {criticalCount} kritik seviyede</span>
          )}
        </p>
      </div>

      {/* Mevcut yem stogu */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {feedItems.map((i) => {
          const isCritical = i.quantity <= i.criticalLevel;
          return (
            <div key={i.id} className="rounded-xl border border-border bg-card p-4">
              <p className="font-medium text-foreground">{i.name}</p>
              <p
                className={`mt-1 text-lg font-bold ${
                  isCritical ? "text-red-600" : "text-foreground"
                }`}
              >
                {i.quantity} {i.unit}
                {isCritical && (
                  <span className="ml-2 rounded bg-red-100 dark:bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                    Kritik
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tuketim formu */}
      {canEdit &&
        (feedItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Önce Stok bölümünden FEED kategorisinde bir kalem ekleyin.
          </p>
        ) : (
          <FeedForm items={feedItems} />
        ))}

      {/* Son tuketimler */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Son Tüketimler</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henuz tuketim kaydi yok.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Tarih</th>
                  <th className="px-4 py-2 font-medium">Yem</th>
                  <th className="px-4 py-2 font-medium">Miktar</th>
                  <th className="px-4 py-2 font-medium">Not</th>
                  {canEdit && <th className="px-4 py-2 text-right font-medium">İşlem</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-2 text-foreground">{formatDate(l.date)}</td>
                    <td className="px-4 py-2 font-medium text-foreground">
                      {l.inventoryItem.name}
                    </td>
                    <td className="px-4 py-2 text-foreground">
                      {l.quantity} {l.inventoryItem.unit}
                    </td>
                    <td className="px-4 py-2 text-foreground">{l.notes ?? "-"}</td>
                    {canEdit && (
                      <td className="px-4 py-2 text-right">
                        <DeleteButton
                          endpoint={`/api/feed/${l.id}`}
                          itemLabel={`${formatDate(l.date)} · ${l.inventoryItem.name}`}
                          kind="Tüketim kaydı"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
