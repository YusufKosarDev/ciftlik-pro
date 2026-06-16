import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canWrite, requirePageView } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { buttonVariants } from "@/components/ui/button";
import { TransactionsTable } from "@/components/tables/transactions-table";

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

function BreakdownList({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: { category: string; total: number }[];
  tone: "green" | "red";
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 font-semibold text-gray-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">Kayit yok.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.category} className="flex justify-between">
              <span className="text-gray-700">{r.category}</span>
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
  // islemler uzerinden DB'de gruplanir (bellege cekmeden) — arama/sayfadan bagimsiz.
  const [transactions, total, grouped] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { [sort]: dir } as Prisma.TransactionOrderByWithRelationInput,
      skip,
      take,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({
      by: ["type", "category"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

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
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <span>💰</span> Finans
        </h1>
        <div className="flex items-center gap-2">
          {/* Dosya indirme ucnoktasi; sayfa navigasyonu degil, bu yuzden <a download>. */}
          <a
            href="/api/transactions/export"
            download
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            ⬇ CSV indir
          </a>
          {canEdit && (
            <Link href="/panel/finans/yeni" className={buttonVariants({ size: "sm" })}>
              + Yeni Islem
            </Link>
          )}
        </div>
      </div>

      {/* Ozet kartlari */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Toplam Gelir</p>
          <p className="mt-1 text-xl font-bold text-green-600">
            {formatMoney(totalIncome)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Toplam Gider</p>
          <p className="mt-1 text-xl font-bold text-red-600">
            {formatMoney(totalExpense)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Net Bakiye</p>
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
          <BreakdownList title="Gelir — Kategori Kırılımı" rows={income} tone="green" />
          <BreakdownList title="Gider — Kategori Kırılımı" rows={expense} tone="red" />
        </div>
      )}

      <TransactionsTable transactions={transactions} canEdit={canEdit} list={list} />
    </div>
  );
}
