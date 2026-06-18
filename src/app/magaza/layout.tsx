// Magaza kok duzeni. Sepet/baslik per-tenant oldugundan [slug] alt duzenindedir;
// burada yalnizca ortak arka plan sarmalayicisi var (ornek: /magaza dizini).
export default function MagazaLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
