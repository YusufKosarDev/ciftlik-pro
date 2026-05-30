import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteFieldButton } from "@/components/delete-field-button";

export default async function TarlalarPage() {
  const fields = await prisma.field.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarlalar</h1>
          <p className="text-sm text-gray-500">Toplam {fields.length} kayit</p>
        </div>
        <Link
          href="/panel/tarlalar/yeni"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          + Yeni Tarla
        </Link>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">Henuz tarla eklenmemis.</p>
          <Link
            href="/panel/tarlalar/yeni"
            className="mt-3 inline-block text-sm font-medium text-green-600 hover:underline"
          >
            Ilk tarlayi ekle
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Ad</th>
                <th className="px-4 py-3 font-medium">Alan (donum)</th>
                <th className="px-4 py-3 font-medium">Konum</th>
                <th className="px-4 py-3 text-right font-medium">Islemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fields.map((field) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/panel/tarlalar/${field.id}`}
                      className="text-green-700 hover:underline"
                    >
                      {field.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{field.area}</td>
                  <td className="px-4 py-3 text-gray-700">{field.location ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/panel/tarlalar/${field.id}/duzenle`}
                        className="text-sm font-medium text-green-600 hover:underline"
                      >
                        Duzenle
                      </Link>
                      <DeleteFieldButton id={field.id} label={field.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
