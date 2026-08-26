import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { InventoryForm } from "@/components/inventory-form";
import { requirePageWrite } from "@/lib/authz";

export default async function YeniStokPage() {
  const t = await getTranslations("Inventory");
  const tc = await getTranslations("Common");
  await requirePageWrite("inventory");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("new")}</h1>
        <Link href="/panel/stok" className="text-sm text-muted-foreground hover:underline">
          {tc("backToList")}
        </Link>
      </div>

      <InventoryForm />
    </div>
  );
}
