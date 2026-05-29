import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { speciesLabels, genderLabels, statusLabels } from "@/lib/labels";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  SOLD: "bg-yellow-100 text-yellow-700",
  DECEASED: "bg-gray-200 text-gray-600",
};

// Tarihi "10.04.2023" gibi gosterir.
function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("tr-TR");
}

// Dogum tarihinden yasi hesaplar (yil/ay).
function calcAge(birthDate: Date | null): string {
  if (!birthDate) return "-";
  const now = new Date();
  const birth = new Date(birthDate);
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return "-";
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths} ay`;
  if (remMonths === 0) return `${years} yas`;
  return `${years} yas ${remMonths} ay`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default async function HayvanDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const animal = await prisma.animal.findUnique({ where: { id } });

  if (!animal) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {animal.name ?? animal.tagNumber}
          </h1>
          <p className="text-sm text-gray-500">Kulak No: {animal.tagNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/panel/hayvanlar"
            className="text-sm text-gray-500 hover:underline"
          >
            &larr; Listeye don
          </Link>
          <Link
            href={`/panel/hayvanlar/${animal.id}/duzenle`}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Duzenle
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <Row label="Kulak No" value={animal.tagNumber} />
        <Row label="Ad" value={animal.name ?? "-"} />
        <Row label="Tur" value={speciesLabels[animal.species]} />
        <Row label="Cins / Irk" value={animal.breed ?? "-"} />
        <Row label="Cinsiyet" value={genderLabels[animal.gender]} />
        <Row label="Dogum Tarihi" value={formatDate(animal.birthDate)} />
        <Row label="Yas" value={calcAge(animal.birthDate)} />
        <Row
          label="Durum"
          value={
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                statusStyles[animal.status]
              }`}
            >
              {statusLabels[animal.status]}
            </span>
          }
        />
        <Row label="Notlar" value={animal.notes ?? "-"} />
      </div>
    </div>
  );
}
