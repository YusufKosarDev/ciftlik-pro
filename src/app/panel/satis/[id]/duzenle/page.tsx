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
  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Satışı Düzenle</h1>
      <SaleForm sale={sale} />
    </div>
  );
}
