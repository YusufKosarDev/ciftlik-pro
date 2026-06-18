import Link from "next/link";
import { notFound } from "next/navigation";
import { canWrite, requirePageView } from "@/lib/authz";
import { withTenant } from "@/lib/tenant-prisma";

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}
function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("tr-TR");
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default async function MusteriDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePageView("/panel/musteriler");

  const { id } = await params;
  // findFirst (findUnique degil) ki forTenant enjeksiyonu where'e tenantId ekleyebilsin;
  // ayrica RLS (withTenant baglami) tekil erisimi DB'de de garanti eder.
  const customer = await withTenant(session.user.tenantId, (db) =>
    db.customer.findFirst({
      where: { id },
      include: { sales: { orderBy: { date: "desc" } } },
    })
  );
  if (!customer) {
    notFound();
  }

  const totalAmount = customer.sales.reduce((sum, s) => sum + s.amount, 0);
  const canEdit = canWrite(session.user.role, "customers");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            {customer.sales.length} satış · {formatMoney(totalAmount)} toplam
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/panel/musteriler" className="text-sm text-muted-foreground hover:underline">
            &larr; Listeye dön
          </Link>
          {canEdit && (
            <Link
              href={`/panel/musteriler/${customer.id}/duzenle`}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Düzenle
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <Row label="Ad / Unvan" value={customer.name} />
        <Row label="Telefon" value={customer.phone ?? "-"} />
        <Row label="E-posta" value={customer.email ?? "-"} />
        <Row label="Not" value={customer.notes ?? "-"} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Satışlar</h2>
        {customer.sales.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Bu müşteriye ait satış kaydı yok.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                    Satılan
                  </th>
                  <th className="bg-muted px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                    Tutar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customer.sales.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-muted">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(s.date)}</td>
                    <td className="px-4 py-3 text-foreground">{s.item}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                      {formatMoney(s.amount)}
                    </td>
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
