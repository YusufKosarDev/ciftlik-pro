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
