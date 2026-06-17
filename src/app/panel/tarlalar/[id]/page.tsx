import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { cropStatusLabels } from "@/lib/labels";
import { CropForm } from "@/components/crop-form";
import { DeleteButton } from "@/components/delete-button";
import { fieldEconomics } from "@/lib/field-economics";

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

const cropStatusStyles: Record<string, string> = {
  PLANTED: "bg-blue-100 text-blue-700",
  GROWING: "bg-green-100 text-green-700",
  HARVESTED: "bg-muted text-muted-foreground",
};

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("tr-TR");
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default async function TarlaDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const field = await prisma.field.findUnique({
    where: { id },
    include: {
      crops: { orderBy: { plantedDate: "desc" } },
    },
  });

  if (!field) {
    notFound();
  }

  const session = await auth();
  const canEdit = session ? canWrite(session.user.role, "fields") : false;

  const eco = fieldEconomics(field.crops, field.area);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{field.name}</h1>
          <p className="text-sm text-muted-foreground">{field.area} donum</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/panel/tarlalar" className="text-sm text-muted-foreground hover:underline">
            &larr; Listeye don
          </Link>
          {canEdit && (
            <Link
              href={`/panel/tarlalar/${field.id}/duzenle`}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Duzenle
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <Row label="Tarla Adi" value={field.name} />
        <Row label="Alan" value={`${field.area} donum`} />
        <Row label="Konum" value={field.location ?? "-"} />
        <Row label="Notlar" value={field.notes ?? "-"} />
      </div>

      {/* Ekonomik ozet */}
      {field.crops.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Toplam Gider</p>
            <p className="mt-1 text-lg font-bold text-red-600">{formatMoney(eco.totalCost)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Toplam Gelir</p>
            <p className="mt-1 text-lg font-bold text-green-600">{formatMoney(eco.totalRevenue)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Net Kâr</p>
            <p className={`mt-1 text-lg font-bold ${eco.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatMoney(eco.profit)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Dönüm Başına Verim</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {eco.yieldPerDonum !== null ? `${eco.yieldPerDonum.toFixed(1)} kg` : "-"}
            </p>
          </div>
        </div>
      )}

      {/* Ekim Kayitlari */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Ekim Kayitlari</h2>

        {canEdit && <CropForm fieldId={field.id} />}

        {field.crops.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henuz ekim kaydi yok.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Ürün</th>
                  <th className="px-4 py-2 font-medium">Ekim</th>
                  <th className="px-4 py-2 font-medium">Hasat</th>
                  <th className="px-4 py-2 font-medium">Durum</th>
                  <th className="px-4 py-2 text-right font-medium">Gider</th>
                  <th className="px-4 py-2 text-right font-medium">Gelir</th>
                  <th className="px-4 py-2 text-right font-medium">Kâr</th>
                  {canEdit && <th className="px-4 py-2 text-right font-medium">İşlem</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {field.crops.map((crop) => {
                  const profit = (crop.revenue ?? 0) - (crop.cost ?? 0);
                  const hasEco = crop.cost !== null || crop.revenue !== null;
                  return (
                  <tr key={crop.id}>
                    <td className="px-4 py-2 font-medium text-foreground">{crop.name}</td>
                    <td className="px-4 py-2 text-foreground">
                      {formatDate(crop.plantedDate)}
                    </td>
                    <td className="px-4 py-2 text-foreground">
                      {formatDate(crop.harvestDate)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          cropStatusStyles[crop.status]
                        }`}
                      >
                        {cropStatusLabels[crop.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-foreground">
                      {crop.cost !== null ? formatMoney(crop.cost) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right text-foreground">
                      {crop.revenue !== null ? formatMoney(crop.revenue) : "-"}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        !hasEco ? "text-muted-foreground" : profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {hasEco ? formatMoney(profit) : "-"}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/panel/tarlalar/${field.id}/ekim/${crop.id}/duzenle`}
                            className="text-sm font-medium text-green-600 hover:underline"
                          >
                            Düzenle
                          </Link>
                          <DeleteButton
                            endpoint={`/api/fields/${field.id}/crops/${crop.id}`}
                            itemLabel={crop.name}
                            kind="Ekim kaydı"
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
      </section>
    </div>
  );
}
