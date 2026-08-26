import { requirePageWrite } from "@/lib/authz";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { SaleForm } from "@/components/sale-form";

export default async function YeniSatisPage() {
  const t = await getTranslations("Sales");
  const session = await requirePageWrite("sales");

  const customers = await withTenant(session.user.tenantId, (db) =>
    db.customer.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("new")}</h1>
      <SaleForm customers={customers} />
    </div>
  );
}
