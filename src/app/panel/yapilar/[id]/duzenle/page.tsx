import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StructureForm } from "@/components/structure-form";
import { requirePageWrite } from "@/lib/authz";

export default async function YapiDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageWrite("structures");

  const { id } = await params;
  const structure = await prisma.structure.findUnique({ where: { id } });

  if (!structure) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Yapiyi Duzenle</h1>
        <Link href="/panel/yapilar" className="text-sm text-muted-foreground hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <StructureForm structure={structure} />
    </div>
  );
}
