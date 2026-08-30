import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Path tabanli per-tenant vitrin: /magaza/[slug] -> tenant cozumleme.
// Tenant tablosu RLS disidir; slug ile herkese acik (oturumsuz) okunur.
// Tekrarlayan veritabani yukunu azaltmak icin 1 saatlik onbellege alinmistir.
export const resolveStorefront = unstable_cache(
  async (slug: string) => {
    return prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
  },
  ["storefront-tenant-slug"],
  {
    revalidate: 3600, // 1 saat
    tags: ["storefront"],
  }
);

// Herkese acik magaza dizini: satista (active) en az bir urunu olan ciftlikler.
//
// NEDEN RAW: Dizin tasarim geregi kiracilar arasidir ve ziyaretci giris
// yapmamistir, dolayisiyla app.tenant_id ayarlanamaz. Product tablosunda FORCE
// RLS oldugundan non-superuser rol dogrudan sorguda 0 satir gorur. Bu yuzden
// okuma, SECURITY DEFINER `public_storefront_tenants` fonksiyonuna tasindi;
// login ve davet okumasiyla birebir ayni desen (bkz. src/lib/invitations.ts).
//
// Fonksiyon URUN DETAYI DONDURMEZ; yalnizca vitrin kimligini (id, ad, slug)
// verir ve siralamayi veritabaninda yapar.
export type StorefrontTenant = {
  id: string;
  name: string;
  slug: string;
};

export async function listStorefrontTenants(): Promise<StorefrontTenant[]> {
  return prisma.$queryRaw<
    Array<StorefrontTenant>
  >`SELECT * FROM public_storefront_tenants()`;
}
