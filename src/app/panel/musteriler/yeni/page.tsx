import { requirePageWrite } from "@/lib/authz";
import { CustomerForm } from "@/components/customer-form";

export default async function YeniMusteriPage() {
  await requirePageWrite("customers");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Yeni Müşteri</h1>
      <CustomerForm />
    </div>
  );
}
