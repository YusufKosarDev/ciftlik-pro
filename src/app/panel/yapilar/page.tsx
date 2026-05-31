import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { structureTypeLabels } from "@/lib/labels";
import { DeleteButton } from "@/components/delete-button";

export default async function YapilarPage() {
  const structures = await prisma.structure.findMany({
    orderBy: { createdAt: "desc" },
  });

  const session = await auth();
  const canEdit = session ? canWrite(session.user.role, "structures") : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <span>🏠</span> Yapilar
          </h1>
          <p className="text-sm text-gray-500">
            Toplam {structures.length} yapi · haritada gosterilir
          </p>
        </div>
        {canEdit && (
          <Link
            href="/panel/yapilar/yeni"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            + Yeni Yapi
          </Link>
        )}
      </div>

      {structures.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">Henuz yapi eklenmemis.</p>
          {canEdit && (
            <Link
              href="/panel/yapilar/yeni"
              className="mt-3 inline-block text-sm font-medium text-green-600 hover:underline"
            >
              Ilk yapiyi ekle
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Ad</th>
                <th className="px-4 py-3 font-medium">Tur</th>
                <th className="px-4 py-3 font-medium">Not</th>
                {canEdit && (
                  <th className="px-4 py-3 text-right font-medium">Islemler</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {structures.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {structureTypeLabels[s.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.notes ?? "-"}</td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/panel/yapilar/${s.id}/duzenle`}
                          className="text-sm font-medium text-green-600 hover:underline"
                        >
                          Duzenle
                        </Link>
                        <DeleteButton
                          endpoint={`/api/structures/${s.id}`}
                          itemLabel={s.name}
                          kind="Yapı"
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
