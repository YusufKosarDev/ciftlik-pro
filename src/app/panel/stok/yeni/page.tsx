import Link from "next/link";
import { InventoryForm } from "@/components/inventory-form";
import { requirePageWrite } from "@/lib/authz";

export default async function YeniStokPage() {
  await requirePageWrite("inventory");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Yeni Stok Kalemi</h1>
        <Link href="/panel/stok" className="text-sm text-muted-foreground hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <InventoryForm />
    </div>
  );
}
