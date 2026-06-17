import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageWrite } from "@/lib/authz";
import { SaleForm } from "@/components/sale-form";

export default async function SatisDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageWrite("sales");

  const { id } = await params;
  const [sale, customers] = await Promise.all([
    prisma.sale.findUnique({ where: { id } }),
    prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!sale) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Satışı Düzenle</h1>
      <SaleForm sale={sale} customers={customers} />
    </div>
  );
}
