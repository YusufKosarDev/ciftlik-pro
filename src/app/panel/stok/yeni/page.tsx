import Link from "next/link";
import { InventoryForm } from "@/components/inventory-form";

export default function YeniStokPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Yeni Stok Kalemi</h1>
        <Link href="/panel/stok" className="text-sm text-gray-500 hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <InventoryForm />
    </div>
  );
}
