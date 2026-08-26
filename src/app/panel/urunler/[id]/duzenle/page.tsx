import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { requirePageWrite } from "@/lib/authz";
import { ProductForm } from "@/components/product-form";

export default async function UrunDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("Products");
  const session = await requirePageWrite("products");

  const { id } = await params;
  const product = await withTenant(session.user.tenantId, (db) =>
    db.product.findFirst({ where: { id } })
  );
  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("editTitle")}</h1>
      <ProductForm product={product} />
    </div>
  );
}
