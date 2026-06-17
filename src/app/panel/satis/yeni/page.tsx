import { requirePageWrite } from "@/lib/authz";
import { SaleForm } from "@/components/sale-form";

export default async function YeniSatisPage() {
  await requirePageWrite("sales");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Yeni Satış</h1>
      <SaleForm />
    </div>
  );
}
