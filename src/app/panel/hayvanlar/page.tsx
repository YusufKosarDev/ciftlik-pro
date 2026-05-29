import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { speciesLabels, genderLabels, statusLabels } from "@/lib/labels";
import { DeleteAnimalButton } from "@/components/delete-animal-button";

// Hayvan durumuna gore renkli rozet stili
const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  SOLD: "bg-yellow-100 text-yellow-700",
  DECEASED: "bg-gray-200 text-gray-600",
};

export default async function HayvanlarPage() {
  const animals = await prisma.animal.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hayvanlar</h1>
          <p className="text-sm text-gray-500">Toplam {animals.length} kayit</p>
        </div>
        <Link
          href="/panel/hayvanlar/yeni"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          + Yeni Hayvan
        </Link>
      </div>

      {animals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">Henuz hayvan eklenmemis.</p>
          <Link
            href="/panel/hayvanlar/yeni"
            className="mt-3 inline-block text-sm font-medium text-green-600 hover:underline"
          >
            Ilk hayvani ekle
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Kulak No</th>
                <th className="px-4 py-3 font-medium">Ad</th>
                <th className="px-4 py-3 font-medium">Tur</th>
                <th className="px-4 py-3 font-medium">Cinsiyet</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 text-right font-medium">Islemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {animals.map((animal) => (
                <tr key={animal.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {animal.tagNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{animal.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {speciesLabels[animal.species]}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {genderLabels[animal.gender]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        statusStyles[animal.status]
                      }`}
                    >
                      {statusLabels[animal.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/panel/hayvanlar/${animal.id}/duzenle`}
                        className="text-sm font-medium text-green-600 hover:underline"
                      >
                        Duzenle
                      </Link>
                      <DeleteAnimalButton
                        id={animal.id}
                        label={animal.name ?? animal.tagNumber}
                      />
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
