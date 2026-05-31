import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { buttonVariants } from "@/components/ui/button";
import { InventoryTable } from "@/components/tables/inventory-table";

export default async function StokPage() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: { createdAt: "desc" },
  });

  const criticalCount = items.filter((i) => i.quantity <= i.criticalLevel).length;

  const session = await auth();
  const canEdit = session ? canWrite(session.user.role, "inventory") : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <span>📦</span> Stok & Envanter
          </h1>
          <p className="text-sm text-gray-500">
            Toplam {items.length} kalem
            {criticalCount > 0 && (
              <span className="ml-2 text-red-600">
                · {criticalCount} kalem kritik seviyede
              </span>
            )}
          </p>
        </div>
        {canEdit && (
          <Link href="/panel/stok/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Kalem
          </Link>
        )}
      </div>

      <InventoryTable items={items} canEdit={canEdit} />
    </div>
  );
}
