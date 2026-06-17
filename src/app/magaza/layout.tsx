import { CartProvider } from "@/components/store/cart-provider";
import { StoreHeader } from "@/components/store/store-header";

// Magaza (herkese acik) duzeni: sepet durumu CartProvider'da tutulur, ust baslik
// sepet sayacini gosterir.
export default function MagazaLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <StoreHeader />
        {children}
      </div>
    </CartProvider>
  );
}
