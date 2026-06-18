import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withTenant } from "@/lib/tenant-prisma";
import { resolveStorefront } from "@/lib/storefront";
import { AddToCartButton } from "@/components/store/add-to-cart-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await resolveStorefront(slug);
  return {
    title: tenant ? `${tenant.name} · Mağaza` : "Mağaza",
    description: "Çiftlikten taze ürünler — sipariş verin.",
  };
}

function formatMoney(a: number): string {
  return a.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

// Per-tenant katalog. Herkese acik; yalnizca bu tenant'in aktif urunleri listelenir
// (withTenant -> RLS/where kapsami baska ciftligin urununu gostermez).
export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await resolveStorefront(slug);
  if (!tenant) {
    notFound();
  }

  const products = await withTenant(tenant.id, (db) =>
    db.product.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } })
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{tenant.name}</h1>
        <p className="text-sm text-muted-foreground">
          Beğendiğiniz ürünleri sepete ekleyip sipariş bırakın — ödeme teslimatta.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          Şu anda satışta ürün yok.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div>
                <h2 className="font-semibold text-foreground">{p.name}</h2>
                {p.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                )}
              </div>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatMoney(p.price)}
                {p.unit ? <span className="text-sm font-normal text-muted-foreground"> / {p.unit}</span> : null}
              </p>
              <div className="mt-auto">
                <AddToCartButton
                  product={{ productId: p.id, name: p.name, price: p.price, unit: p.unit }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
