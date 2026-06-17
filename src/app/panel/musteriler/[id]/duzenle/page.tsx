import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageWrite } from "@/lib/authz";
import { CustomerForm } from "@/components/customer-form";

export default async function MusteriDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageWrite("customers");

  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Müşteriyi Düzenle</h1>
      <CustomerForm customer={customer} />
    </div>
  );
}
