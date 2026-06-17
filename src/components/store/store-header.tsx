"use client";

import Link from "next/link";
import { Wheat, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";

export function StoreHeader() {
  const { count } = useCart();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/magaza" className="flex items-center gap-2.5 text-lg font-bold text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
            <Wheat className="h-5 w-5" />
          </span>
          Çiftlik Pro · Mağaza
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/magaza/sepet"
            className="relative inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition hover:bg-muted"
          >
            <ShoppingCart className="h-4 w-4" />
            Sepet
            {count > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link href="/giris" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
            Yönetim girişi →
          </Link>
        </div>
      </div>
    </header>
  );
}
