import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { speciesLabels, genderLabels, statusLabels } from "@/lib/labels";
import { HealthRecordForm } from "@/components/health-record-form";
import { VaccinationForm } from "@/components/vaccination-form";
import { MilkYieldForm } from "@/components/milk-yield-form";

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

// Sonraki asi tarihine gore uyari rozeti dondurur.
function nextVaccineBadge(nextDate: Date | null): React.ReactNode {
  if (!nextDate) return "-";
  const next = new Date(nextDate);
  const now = new Date();
  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const label = next.toLocaleDateString("tr-TR");

  if (diffDays < 0) {
    return (
      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        {label} (gecti)
      </span>
    );
  }
  if (diffDays <= 30) {
    return (
      <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
        {label} ({diffDays} gun kaldi)
      </span>
    );
  }
  return <span className="text-gray-700">{label}</span>;
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
  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      healthRecords: { orderBy: { date: "desc" } },
      vaccinations: { orderBy: { date: "desc" } },
      milkYields: { orderBy: { date: "desc" } },
    },
  });

  if (!animal) {
    notFound();
  }

  // Sut verimi ozeti
  const totalMilk = animal.milkYields.reduce((sum, m) => sum + m.amount, 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7 = animal.milkYields.filter((m) => new Date(m.date) >= sevenDaysAgo);
  const avg7Milk =
    last7.length > 0
      ? last7.reduce((sum, m) => sum + m.amount, 0) / last7.length
      : 0;

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

      {/* Saglik Kayitlari */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Saglik Kayitlari</h2>

        <HealthRecordForm animalId={animal.id} />

        {animal.healthRecords.length === 0 ? (
          <p className="text-sm text-gray-500">Henuz saglik kaydi yok.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Tarih</th>
                  <th className="px-4 py-2 font-medium">Teshis</th>
                  <th className="px-4 py-2 font-medium">Tedavi</th>
                  <th className="px-4 py-2 font-medium">Not</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {animal.healthRecords.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 text-gray-700">{formatDate(r.date)}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {r.diagnosis}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{r.treatment ?? "-"}</td>
                    <td className="px-4 py-2 text-gray-700">{r.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Asi Takvimi */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Asi Takvimi</h2>

        <VaccinationForm animalId={animal.id} />

        {animal.vaccinations.length === 0 ? (
          <p className="text-sm text-gray-500">Henuz asi kaydi yok.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Asi</th>
                  <th className="px-4 py-2 font-medium">Yapilis</th>
                  <th className="px-4 py-2 font-medium">Sonraki</th>
                  <th className="px-4 py-2 font-medium">Not</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {animal.vaccinations.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2 font-medium text-gray-900">{v.name}</td>
                    <td className="px-4 py-2 text-gray-700">{formatDate(v.date)}</td>
                    <td className="px-4 py-2">{nextVaccineBadge(v.nextDate)}</td>
                    <td className="px-4 py-2 text-gray-700">{v.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sut Verimi */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Sut Verimi</h2>

        {animal.milkYields.length > 0 && (
          <div className="flex gap-4">
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
              <p className="text-xs text-gray-500">Toplam</p>
              <p className="text-lg font-bold text-gray-900">
                {totalMilk.toFixed(1)} L
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
              <p className="text-xs text-gray-500">Son 7 gun ortalama</p>
              <p className="text-lg font-bold text-gray-900">
                {avg7Milk.toFixed(1)} L/gun
              </p>
            </div>
          </div>
        )}

        <MilkYieldForm animalId={animal.id} />

        {animal.milkYields.length === 0 ? (
          <p className="text-sm text-gray-500">Henuz sut verimi kaydi yok.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Tarih</th>
                  <th className="px-4 py-2 font-medium">Miktar (L)</th>
                  <th className="px-4 py-2 font-medium">Not</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {animal.milkYields.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2 text-gray-700">{formatDate(m.date)}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {m.amount.toFixed(1)}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{m.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
