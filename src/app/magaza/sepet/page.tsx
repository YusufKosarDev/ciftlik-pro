import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";

export const metadata: Metadata = {
  title: "Sepet",
};

export default function SepetPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Sepetiniz</h1>
      <CartView />
    </div>
  );
}
