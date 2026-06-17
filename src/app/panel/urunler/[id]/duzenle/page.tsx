import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageWrite } from "@/lib/authz";
import { ProductForm } from "@/components/product-form";

export default async function UrunDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageWrite("products");

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Ürünü Düzenle</h1>
      <ProductForm product={product} />
    </div>
  );
}
