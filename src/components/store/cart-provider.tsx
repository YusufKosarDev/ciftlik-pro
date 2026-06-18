"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  unit: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);

// Sepet per-tenant'tir: her vitrinin (slug) kendi anahtari olur ki farkli
// ciftliklerin sepetleri karismasin.
export function CartProvider({
  children,
  storageKey = "ciftlik-cart",
}: {
  children: React.ReactNode;
  storageKey?: string;
}) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Sepeti mount sonrasi (ve anahtar degisince) localStorage'dan yukle.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      // bozuk veri: yoksay
    }
  }, [storageKey]);

  // Durumu gunceller ve localStorage'a yazar.
  const update = useCallback(
    (next: CartItem[]) => {
      setItems(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // kota/erisim hatasi: yoksay
      }
    },
    [storageKey]
  );

  const add = useCallback(
    (item: Omit<CartItem, "quantity">, qty = 1) => {
      const existing = items.find((i) => i.productId === item.productId);
      const next = existing
        ? items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i
          )
        : [...items, { ...item, quantity: qty }];
      update(next);
    },
    [items, update]
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      if (qty <= 0) {
        update(items.filter((i) => i.productId !== productId));
        return;
      }
      update(items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
    },
    [items, update]
  );

  const remove = useCallback(
    (productId: string) => update(items.filter((i) => i.productId !== productId)),
    [items, update]
  );

  const clear = useCallback(() => update([]), [update]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      add,
      setQty,
      remove,
      clear,
      count: items.reduce((s, i) => s + i.quantity, 0),
      total: items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    [items, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart, CartProvider icinde kullanilmalidir");
  return ctx;
}
