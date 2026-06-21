"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-provider";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

import { useFormat } from "@/lib/format";

export function CartView({ slug }: { slug: string }) {
  const { formatMoney } = useFormat();
  const { items, setQty, remove, total, count, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function checkout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      slug,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      customerName: String(fd.get("customerName")),
      customerPhone: String(fd.get("customerPhone")),
      note: String(fd.get("note")),
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setLoading(false);
      setError(data?.error ?? "Sipariş alınamadı, lütfen tekrar deneyin");
      return;
    }

    // Ödeme yapılandırılmışsa Stripe ödeme sayfasına yönlendir (sepet temizlenir).
    if (data?.checkoutUrl) {
      clear();
      window.location.href = data.checkoutUrl;
      return;
    }

    setLoading(false);
    clear();
    setDone(true);
    toast.success("Siparişiniz alındı!");
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
          ✓ Siparişiniz alındı
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          En kısa sürede sizinle iletişime geçilecek.
        </p>
        <Link href={`/magaza/${slug}`} className="mt-4 inline-block text-sm font-medium text-green-600 hover:underline dark:text-green-400">
          ← Mağazaya dön
        </Link>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Sepetiniz boş.</p>
        <Link href={`/magaza/${slug}`} className="mt-3 inline-block text-sm font-medium text-green-600 hover:underline dark:text-green-400">
          ← Ürünlere göz at
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Sepet kalemleri */}
      <div className="space-y-3 lg:col-span-2">
        {items.map((i) => (
          <div
            key={i.productId}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{i.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatMoney(i.price)}
                {i.unit ? ` / ${i.unit}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQty(i.productId, i.quantity - 1)}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Azalt"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center text-sm tabular-nums">{i.quantity}</span>
              <button
                type="button"
                onClick={() => setQty(i.productId, i.quantity + 1)}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Artır"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="w-24 text-right text-sm font-medium text-foreground">
              {formatMoney(i.price * i.quantity)}
            </span>
            <button
              type="button"
              onClick={() => remove(i.productId)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600"
              aria-label="Kaldır"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Ozet + iletisim + onay */}
      <form onSubmit={checkout} className="h-fit space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between text-lg font-bold text-foreground">
          <span>Toplam</span>
          <span className="tabular-nums">{formatMoney(total)}</span>
        </div>
        <div className="space-y-3 border-t border-border pt-4">
          <input name="customerName" type="text" required placeholder="Adınız *" aria-label="Adınız" className={inputClass} />
          <input name="customerPhone" type="text" placeholder="Telefon (opsiyonel)" aria-label="Telefon" className={inputClass} />
          <textarea name="note" rows={2} placeholder="Not (opsiyonel)" aria-label="Not" className={inputClass} />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Siparişi tamamla
        </Button>
        <p className="text-center text-xs text-muted-foreground">Ödeme teslimatta</p>
      </form>
    </div>
  );
}
