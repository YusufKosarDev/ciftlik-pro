import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requirePageWrite } from "@/lib/authz";
import { withTenant } from "@/lib/tenant-prisma";
import { CustomerForm } from "@/components/customer-form";

export default async function MusteriDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("Customers");
  const session = await requirePageWrite("customers");

  const { id } = await params;
  const customer = await withTenant(session.user.tenantId, (db) =>
    db.customer.findFirst({ where: { id } })
  );
  if (!customer) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("editTitle")}</h1>
      <CustomerForm customer={customer} />
    </div>
  );
}
