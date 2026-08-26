import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CartView } from "@/components/store/cart-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Store");
  return { title: t("cart") };
}

export default async function SepetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("Store");
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("cartTitle")}</h1>
      <CartView slug={slug} />
    </div>
  );
}
