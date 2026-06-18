import Link from "next/link";
import { notFound } from "next/navigation";
import { withTenant } from "@/lib/tenant-prisma";
import { InventoryForm } from "@/components/inventory-form";
import { requirePageWrite } from "@/lib/authz";

export default async function StokDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePageWrite("inventory");

  const { id } = await params;
  const item = await withTenant(session.user.tenantId, (db) =>
    db.inventoryItem.findFirst({ where: { id } })
  );

  if (!item) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Stok Kalemini Duzenle</h1>
        <Link href="/panel/stok" className="text-sm text-muted-foreground hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <InventoryForm item={item} />
    </div>
  );
}
