import { notFound } from "next/navigation";
import { CartProvider } from "@/components/store/cart-provider";
import { StoreHeader } from "@/components/store/store-header";
import { resolveStorefront } from "@/lib/storefront";

// Per-tenant vitrin duzeni: slug'i tenant'a cozumler. Sepet, slug'a ozel bir
// localStorage anahtariyla tutulur (farkli ciftliklerin sepetleri karismaz).
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
