import Link from "next/link";
import { notFound } from "next/navigation";
import { withTenant } from "@/lib/tenant-prisma";
import { TransactionForm } from "@/components/transaction-form";
import { requirePageWrite } from "@/lib/authz";

export default async function IslemDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePageWrite("transactions");

  const { id } = await params;
  const transaction = await withTenant(session.user.tenantId, (db) =>
    db.transaction.findFirst({ where: { id } })
  );

  if (!transaction) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Islemi Duzenle</h1>
        <Link href="/panel/finans" className="text-sm text-muted-foreground hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <TransactionForm transaction={transaction} />
    </div>
  );
}
