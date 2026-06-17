import { requirePageWrite } from "@/lib/authz";
import { ProductForm } from "@/components/product-form";

export default async function YeniUrunPage() {
  await requirePageWrite("products");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Yeni Ürün</h1>
      <ProductForm />
    </div>
  );
}
