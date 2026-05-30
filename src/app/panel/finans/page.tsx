import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { transactionTypeLabels } from "@/lib/labels";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("tr-TR");
}

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

export default async function FinansPage() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <span>💰</span> Finans
        </h1>
        <Link
          href="/panel/finans/yeni"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          + Yeni Islem
        </Link>
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

      {transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">Henuz islem eklenmemis.</p>
          <Link
            href="/panel/finans/yeni"
            className="mt-3 inline-block text-sm font-medium text-green-600 hover:underline"
          >
            Ilk islemi ekle
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium">Tur</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 text-right font-medium">Tutar</th>
                <th className="px-4 py-3 text-right font-medium">Islemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{formatDate(t.date)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        t.type === "INCOME"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {transactionTypeLabels[t.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{t.category}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      t.type === "INCOME" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatMoney(t.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/panel/finans/${t.id}/duzenle`}
                        className="text-sm font-medium text-green-600 hover:underline"
                      >
                        Duzenle
                      </Link>
                      <DeleteTransactionButton id={t.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
