import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Sipariş tamamlandı",
};

// Stripe odemesi sonrasi donulen sayfa. (Sepet, odemeye yonlendirilirken
// temizlenmistir.) Siparis durumu webhook ile guncellenir.
export default async function SiparisTamamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Siparişiniz alındı</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Teşekkürler! Ödemeniz onaylandığında siparişiniz hazırlanmaya başlanacak.
      </p>
      <Link
        href={`/magaza/${slug}`}
        className="mt-6 inline-block text-sm font-medium text-green-600 hover:underline dark:text-green-400"
      >
        ← Mağazaya dön
      </Link>
    </div>
  );
}
