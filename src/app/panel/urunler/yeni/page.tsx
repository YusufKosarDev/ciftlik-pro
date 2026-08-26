import { requirePageWrite } from "@/lib/authz";
import { getTranslations } from "next-intl/server";
import { ProductForm } from "@/components/product-form";

export default async function YeniUrunPage() {
  const t = await getTranslations("Products");
  await requirePageWrite("products");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("new")}</h1>
      <ProductForm />
    </div>
  );
}
