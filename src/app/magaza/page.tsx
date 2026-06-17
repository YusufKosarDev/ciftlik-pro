import type { Metadata } from "next";
import Link from "next/link";
import { Wheat } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StoreOrderForm } from "@/components/store-order-form";

export const metadata: Metadata = {
  title: "Mağaza",
  description: "Çiftlikten taze ürünler — sipariş verin.",
};

function formatMoney(a: number): string {
  return a.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

// Herkese acik katalog. Kimlik gerektirmez; yalnizca aktif urunler listelenir.
export default async function MagazaPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5 text-lg font-bold text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
              <Wheat className="h-5 w-5" />
            </span>
            Çiftlik Pro · Mağaza
          </div>
          <Link href="/giris" className="text-sm text-muted-foreground hover:text-foreground">
            Yönetim girişi →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Taze ürünler</h1>
          <p className="text-sm text-muted-foreground">
            Beğendiğiniz ürünü seçip sipariş bırakın — ödeme teslimatta.
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
                  <StoreOrderForm productId={p.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
