// The storefront's root layout. The cart and header are per-tenant and therefore
// live in the [slug] sub-layout; only the shared background wrapper is here (the
// /magaza directory, for instance).
export default function MagazaLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
