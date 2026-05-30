import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FieldForm } from "@/components/field-form";

export default async function TarlaDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const field = await prisma.field.findUnique({ where: { id } });

  if (!field) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tarlayi Duzenle</h1>
        <Link href="/panel/tarlalar" className="text-sm text-gray-500 hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <FieldForm field={field} />
    </div>
  );
}
