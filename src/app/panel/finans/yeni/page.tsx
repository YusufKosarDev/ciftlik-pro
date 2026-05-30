import Link from "next/link";
import { TransactionForm } from "@/components/transaction-form";

export default function YeniIslemPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Yeni Islem</h1>
        <Link href="/panel/finans" className="text-sm text-gray-500 hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <TransactionForm />
    </div>
  );
}
