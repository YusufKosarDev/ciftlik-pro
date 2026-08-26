import { requirePageWrite } from "@/lib/authz";
import { getTranslations } from "next-intl/server";
import { CustomerForm } from "@/components/customer-form";

export default async function YeniMusteriPage() {
  const t = await getTranslations("Customers");
  await requirePageWrite("customers");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("new")}</h1>
      <CustomerForm />
    </div>
  );
}
