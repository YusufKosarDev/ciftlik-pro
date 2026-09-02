import { notFound } from "next/navigation";
import { CartProvider } from "@/components/store/cart-provider";
import { StoreHeader } from "@/components/store/store-header";
import { resolveStorefront } from "@/lib/storefront";

// The per-tenant storefront layout: resolves the slug to a tenant. The cart is
// kept under a slug-specific localStorage key, so different farms' carts cannot
// mix.
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await resolveStorefront(slug);
  if (!tenant) {
    notFound();
  }

  return (
    <CartProvider storageKey={`ciftlik-cart:${slug}`}>
      <StoreHeader slug={slug} farmName={tenant.name} />
      {children}
    </CartProvider>
  );
}
