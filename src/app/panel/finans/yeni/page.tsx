import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TransactionForm } from "@/components/transaction-form";
import { requirePageWrite } from "@/lib/authz";

export default async function YeniIslemPage() {
  const t = await getTranslations("Finance");
  const tc = await getTranslations("Common");
  await requirePageWrite("transactions");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("new")}</h1>
        <Link href="/panel/finans" className="text-sm text-muted-foreground hover:underline">
          {tc("backToList")}
        </Link>
      </div>

      <TransactionForm />
    </div>
  );
}
