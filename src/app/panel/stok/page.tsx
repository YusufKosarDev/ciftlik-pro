import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { inventoryCategoryLabels } from "@/lib/labels";
import { DeleteButton } from "@/components/delete-button";

export default async function StokPage() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: { createdAt: "desc" },
  });

  const criticalCount = items.filter(
    (i) => i.quantity <= i.criticalLevel
  ).length;

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
          <Link
            href="/panel/stok/yeni"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            + Yeni Kalem
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">Henuz stok kalemi eklenmemis.</p>
          {canEdit && (
            <Link
              href="/panel/stok/yeni"
              className="mt-3 inline-block text-sm font-medium text-green-600 hover:underline"
            >
              Ilk kalemi ekle
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Kalem</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Miktar</th>
                <th className="px-4 py-3 font-medium">Kritik</th>
                {canEdit && (
                  <th className="px-4 py-3 text-right font-medium">Islemler</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const isCritical = item.quantity <= item.criticalLevel;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {inventoryCategoryLabels[item.category]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          isCritical
                            ? "font-semibold text-red-600"
                            : "text-gray-700"
                        }
                      >
                        {item.quantity} {item.unit}
                        {isCritical && (
                          <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Kritik
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.criticalLevel} {item.unit}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`/panel/stok/${item.id}/duzenle`}
                            className="text-sm font-medium text-green-600 hover:underline"
                          >
                            Duzenle
                          </Link>
                          <DeleteButton
                          endpoint={`/api/inventory/${item.id}`}
                          itemLabel={item.name}
                          kind="Stok kalemi"
                        />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
