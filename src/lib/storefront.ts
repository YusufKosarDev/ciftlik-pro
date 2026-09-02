import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Path-based per-tenant storefront: /magaza/[slug] -> resolve the tenant.
// The Tenant table is outside RLS; it is read publicly by slug, with no session.
// Cached for an hour to keep the repeated database load down.
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

// The public storefront directory: farms with at least one product on sale.
//
// WHY RAW: the directory is cross-tenant by design and the visitor is not signed
// in, so app.tenant_id cannot be set. Product is under FORCE RLS, so a
// non-superuser role sees 0 rows from a direct query. The read therefore goes
// through the SECURITY DEFINER function `public_storefront_tenants` — exactly the
// pattern used for the sign-in and invitation lookups (see src/lib/invitations.ts).
//
// The function RETURNS NO PRODUCT DETAIL; it yields only the storefront's identity
// (id, name, slug) and does the ordering in the database.
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
