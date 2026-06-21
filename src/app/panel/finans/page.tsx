import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { canWrite, requirePageView } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { withTenant } from "@/lib/tenant-prisma";
import { buttonVariants } from "@/components/ui/button";
import { TransactionsTable } from "@/components/tables/transactions-table";
import { getTranslations } from "next-intl/server";

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

function BreakdownList({
  title,
  rows,
  tone,
  emptyText,
}: {
  title: string;
  rows: { category: string; total: number }[];
  tone: "green" | "red";
  emptyText: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 font-semibold text-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.category} className="flex justify-between">
              <span className="text-foreground">{r.category}</span>
              <span className={`font-medium ${tone === "green" ? "text-green-600" : "text-red-600"}`}>
                {formatMoney(r.total)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function FinansPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Finans hassas veridir: yalnizca menusunde finans gorunen roller
  // (ADMIN, ACCOUNTANT) bu sayfayi acabilir. Digerleri panele yonlenir.
  const session = await requirePageView("/panel/finans");
  const t = await getTranslations("Finance");

  const { page, q, sort, dir, skip, take } = parseListParams(await searchParams, {
    sortableKeys: ["date", "type", "category", "amount"],
    defaultSort: "date",
    defaultDir: "desc",
  });

  const where: Prisma.TransactionWhereInput = q
    ? {
        OR: [
          { category: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  // Tablo: aranan/sayfalanan kayitlar. Ozet ve kategori kirilimi ise TUM
  // islemler uzerinden DB'de gruplanir (belleğe cekmeden) — arama/sayfadan bagimsiz.
  const { transactions, total, grouped } = await withTenant(session.user.tenantId, async (db) => {
    const [transactions, total, grouped] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { [sort]: dir } as Prisma.TransactionOrderByWithRelationInput,
        skip,
        take,
      }),
      db.transaction.count({ where }),
      db.transaction.groupBy({
        by: ["type", "category"],
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
    ]);
    return { transactions, total, grouped };
  });

  const income = grouped
    .filter((g) => g.type === "INCOME")
    .map((g) => ({ category: g.category, total: g._sum.amount ?? 0 }));
  const expense = grouped
    .filter((g) => g.type === "EXPENSE")
    .map((g) => ({ category: g.category, total: g._sum.amount ?? 0 }));

  const totalIncome = income.reduce((s, r) => s + r.total, 0);
  const totalExpense = expense.reduce((s, r) => s + r.total, 0);
  const balance = totalIncome - totalExpense;

  const canEdit = canWrite(session.user.role, "transactions");
  const list: ListState = { total, page, pageSize: take, q, sort, dir };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <span>💰</span> {t("title")}
        </h1>
        <div className="flex items-center gap-2">
          {/* Dosya indirme ucnoktasi; sayfa navigasyonu degil, bu yuzden <a download>. */}
          <a
            href="/api/transactions/export"
            download
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            {t("exportCsv")}
          </a>
          {canEdit && (
            <Link href="/panel/finans/yeni" className={buttonVariants({ size: "sm" })}>
              + {t("new")}
            </Link>
          )}
        </div>
      </div>

      {/* Ozet kartlari */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t("income")}</p>
          <p className="mt-1 text-xl font-bold text-green-600">
            {formatMoney(totalIncome)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t("expense")}</p>
          <p className="mt-1 text-xl font-bold text-red-600">
            {formatMoney(totalExpense)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t("title")} Net Bakiye</p>
          <p
            className={`mt-1 text-xl font-bold ${
              balance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatMoney(balance)}
          </p>
        </div>
      </div>

      {/* Kategori kirilimi */}
      {grouped.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <BreakdownList
            title={`${t("income")} — ${t("breakdown")}`}
            rows={income}
            tone="green"
            emptyText={t("noRecords")}
          />
          <BreakdownList
            title={`${t("expense")} — ${t("breakdown")}`}
            rows={expense}
            tone="red"
            emptyText={t("noRecords")}
          />
        </div>
      )}

      <TransactionsTable transactions={transactions} canEdit={canEdit} list={list} />
    </div>
  );
}
