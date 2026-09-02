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

// The storefront directory: every farm (tenant) has its own storefront under
// /magaza/[slug]. The Tenant table is outside RLS, and the directory is read
// publicly.
//
// OPT-IN: only farms with AT LEAST ONE product on sale (active) are listed.
// Listing every registered tenant automatically caused two problems: (1) anyone
// who signed up landed in a public directory without selling anything, and (2)
// empty storefronts piled up in the demo environment. Adding a product is a
// natural "publish" signal; filling the catalogue is enough to get listed.
// NOTE: the read moved to the SECURITY DEFINER function
// `public_storefront_tenants` (see migration
// 20260830120000_public_storefront_function). The visitor is not signed in, so no
// tenant context can be set, and Product is under FORCE RLS — a direct query would
// return 0 rows under the non-superuser role in production. The function returns
// only the name and slug; no product detail leaks.
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
