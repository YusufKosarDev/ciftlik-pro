import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { formatDate, formatMoney } from "@/lib/format";
import { notFound } from "next/navigation";
import { canWrite, requirePageView } from "@/lib/authz";
import { withTenant } from "@/lib/tenant-prisma";

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
  const [session, t, tc, locale] = await Promise.all([
    requirePageView("/panel/musteriler"),
    getTranslations("Customers"),
    getTranslations("Common"),
    getLocale(),
  ]);

  const { id } = await params;
  // findFirst rather than findUnique, so the forTenant injection can add tenantId
  // to the where; RLS (the withTenant context) also guarantees the single-row
  // access at the database level.
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
            {t("salesCount", { count: customer.sales.length })} · {t("totalSales")} {formatMoney(totalAmount, locale)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/panel/musteriler" className="text-sm text-muted-foreground hover:underline">
            {t("backToList")}
          </Link>
          {canEdit && (
            <Link
              href={`/panel/musteriler/${customer.id}/duzenle`}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              {tc("edit")}
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <Row label={t("nameTitle")} value={customer.name} />
        <Row label={t("phone")} value={customer.phone ?? "-"} />
        <Row label={t("email")} value={customer.email ?? "-"} />
        <Row label={tc("note")} value={customer.notes ?? "-"} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">{t("sales")}</h2>
        {customer.sales.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t("noSales")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                    {tc("date")}
                  </th>
                  <th className="bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                    {t("soldItem")}
                  </th>
                  <th className="bg-muted px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                    {tc("amount")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customer.sales.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-muted">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(s.date, locale)}</td>
                    <td className="px-4 py-3 text-foreground">{s.item}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-700 dark:text-green-400">
                      {formatMoney(s.amount, locale)}
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
