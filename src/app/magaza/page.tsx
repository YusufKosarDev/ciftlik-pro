import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Store, ArrowRight } from "lucide-react";
import { listStorefrontTenants } from "@/lib/storefront";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Store");
  return {
    title: t("directoryMetaTitle"),
    description: t("directoryMetaDescription"),
  };
}

// Magaza dizini: her ciftligin (tenant) kendi vitrini /magaza/[slug] altindadir.
// Tenant tablosu RLS disidir; dizin herkese acik okunur.
//
// OPT-IN: Yalnizca satista (active) EN AZ BIR urunu olan ciftlikler listelenir.
// Kayit olan her tenant'i otomatik listelemek iki sorun uretiyordu: (1) yeni
// kaydolan herkes hicbir sey satmadan herkese acik dizine dusuyordu, (2) demo
// ortaminda bos vitrinler birikiyordu. Urun eklemek dogal bir "yayinla"
// sinyalidir; katalogu doldurmak listeye girmek icin yeterlidir.
// NOT: Okuma, SECURITY DEFINER `public_storefront_tenants` fonksiyonuna tasindi
// (bkz. migration 20260830120000_public_storefront_function). Ziyaretci giris
// yapmadigindan tenant baglami ayarlanamaz; Product'ta FORCE RLS oldugu icin
// dogrudan sorgu, uretimdeki non-superuser rolle 0 satir dondururdu. Fonksiyon
// yalnizca ad ve slug doner — urun detayi sizmaz.
export default async function MagazaDizinPage() {
  const t = await getTranslations("Store");
  const farms = await listStorefrontTenants();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
          <Store className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t("directoryTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("directorySubtitle")}</p>
      </div>

      {farms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          {t("directoryEmpty")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {farms.map((f) => (
            <Link
              key={f.slug}
              href={`/magaza/${f.slug}`}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="font-semibold text-foreground">{f.name}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-green-600 dark:group-hover:text-green-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
