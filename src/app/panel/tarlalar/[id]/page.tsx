import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { getLabels } from "@/lib/get-labels";
import { formatDate, formatMoney } from "@/lib/format";
import { CropForm } from "@/components/crop-form";
import { DeleteButton } from "@/components/delete-button";
import { fieldEconomics } from "@/lib/field-economics";

const cropStatusStyles: Record<string, string> = {
  PLANTED: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  GROWING: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  HARVESTED: "bg-muted text-muted-foreground",
};

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
  const [session, t, tc, locale, { cropStatusLabels }] = await Promise.all([
    auth(),
    getTranslations("Fields"),
    getTranslations("Common"),
    getLocale(),
    getLabels(),
  ]);
  const field = await withTenant(session!.user.tenantId, (db) =>
    db.field.findFirst({
      where: { id },
      include: {
        crops: { orderBy: { plantedDate: "desc" } },
      },
    })
  );

  if (!field) {
    notFound();
  }

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
              {tc("edit")}
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <Row label={t("fieldName")} value={field.name} />
        <Row label={t("areaShort")} value={t("areaValue", { area: field.area })} />
        <Row label={t("location")} value={field.location ?? "-"} />
        <Row label={tc("notes")} value={field.notes ?? "-"} />
      </div>

      {/* Ekonomik ozet */}
      {field.crops.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{t("totalExpense")}</p>
            <p className="mt-1 text-lg font-bold text-red-600">{formatMoney(eco.totalCost, locale)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{t("totalIncome")}</p>
            <p className="mt-1 text-lg font-bold text-green-600">{formatMoney(eco.totalRevenue, locale)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{t("netProfit")}</p>
            <p className={`mt-1 text-lg font-bold ${eco.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatMoney(eco.profit, locale)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{t("yieldPerDecare")}</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {eco.yieldPerDonum !== null ? `${eco.yieldPerDonum.toFixed(1)} kg` : "-"}
            </p>
          </div>
        </div>
      )}

      {/* Ekim Kayitlari */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">{t("cropRecords")}</h2>

        {canEdit && <CropForm fieldId={field.id} />}

        {field.crops.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noCrops")}</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("crop")}</th>
                  <th className="px-4 py-2 font-medium">{t("planted")}</th>
                  <th className="px-4 py-2 font-medium">{t("harvest")}</th>
                  <th className="px-4 py-2 font-medium">{tc("status")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("expense")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("income")}</th>
                  <th className="px-4 py-2 text-right font-medium">Kâr</th>
                  {canEdit && <th className="px-4 py-2 text-right font-medium">{tc("action")}</th>}
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
                      {formatDate(crop.plantedDate, locale)}
                    </td>
                    <td className="px-4 py-2 text-foreground">
                      {formatDate(crop.harvestDate, locale)}
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
                      {crop.cost !== null ? formatMoney(crop.cost, locale) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right text-foreground">
                      {crop.revenue !== null ? formatMoney(crop.revenue, locale) : "-"}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        !hasEco ? "text-muted-foreground" : profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {hasEco ? formatMoney(profit, locale) : "-"}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/panel/tarlalar/${field.id}/ekim/${crop.id}/duzenle`}
                            className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
                          >
                            {tc("edit")}
                          </Link>
                          <DeleteButton
                            endpoint={`/api/fields/${field.id}/crops/${crop.id}`}
                            itemLabel={crop.name}
                            kind={t("cropRecordKind")}
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
