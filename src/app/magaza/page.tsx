import type { Metadata } from "next";
import Link from "next/link";
import { Store, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Mağazalar",
  description: "Çiftlik Pro üzerindeki çiftliklerin vitrinleri.",
};

// Magaza dizini: her ciftligin (tenant) kendi vitrini /magaza/[slug] altindadir.
// Tenant tablosu RLS disidir; tum vitrinler herkese acik listelenir.
export default async function MagazaDizinPage() {
  const farms = await prisma.tenant.findMany({
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
          <Store className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Çiftlik mağazaları</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bir çiftlik seçin, taze ürünlerini görün ve sipariş bırakın.
        </p>
      </div>

      {farms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          Henüz mağaza yok.
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
