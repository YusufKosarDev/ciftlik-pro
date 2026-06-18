import { prisma } from "@/lib/prisma";

// Path tabanli per-tenant vitrin: /magaza/[slug] -> tenant cozumleme.
// Tenant tablosu RLS disidir; slug ile herkese acik (oturumsuz) okunur.
export async function resolveStorefront(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
}
