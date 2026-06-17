import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FieldForm } from "@/components/field-form";
import { requirePageWrite } from "@/lib/authz";

export default async function TarlaDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageWrite("fields");

  const { id } = await params;
  const field = await prisma.field.findUnique({ where: { id } });

  if (!field) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tarlayi Duzenle</h1>
        <Link href="/panel/tarlalar" className="text-sm text-muted-foreground hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <FieldForm field={field} />
    </div>
  );
}
