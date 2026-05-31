import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AnimalForm } from "@/components/animal-form";
import { requirePageWrite } from "@/lib/authz";

export default async function HayvanDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageWrite("animals");

  const { id } = await params;
  const animal = await prisma.animal.findUnique({ where: { id } });

  if (!animal) {
    notFound();
  }

  // Anne adaylari: disi hayvanlar (kendisi haric)
  const mothers = await prisma.animal.findMany({
    where: { gender: "FEMALE", id: { not: id } },
    select: { id: true, tagNumber: true, name: true },
    orderBy: { tagNumber: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hayvani Duzenle</h1>
        <Link href="/panel/hayvanlar" className="text-sm text-gray-500 hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <AnimalForm animal={animal} mothers={mothers} />
    </div>
  );
}
