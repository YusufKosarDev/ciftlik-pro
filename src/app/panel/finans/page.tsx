import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canWrite, requirePageView } from "@/lib/authz";
import { buttonVariants } from "@/components/ui/button";
import { TransactionsTable } from "@/components/tables/transactions-table";

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

export default async function FinansPage() {
  // Finans hassas veridir: yalnizca menusunde finans gorunen roller
  // (ADMIN, ACCOUNTANT) bu sayfayi acabilir. Digerleri panele yonlenir.
  const session = await requirePageView("/panel/finans");

  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
  });

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const canEdit = canWrite(session.user.role, "transactions");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <span>💰</span> Finans
        </h1>
        {canEdit && (
          <Link href="/panel/finans/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Islem
          </Link>
        )}
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

      <TransactionsTable transactions={transactions} canEdit={canEdit} />
    </div>
  );
}
