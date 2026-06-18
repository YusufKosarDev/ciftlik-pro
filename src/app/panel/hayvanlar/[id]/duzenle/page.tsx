import Link from "next/link";
import { notFound } from "next/navigation";
import { withTenant } from "@/lib/tenant-prisma";
import { AnimalForm } from "@/components/animal-form";
import { requirePageWrite } from "@/lib/authz";

export default async function HayvanDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePageWrite("animals");

  const { id } = await params;
  const [animal, mothers] = await withTenant(session.user.tenantId, (db) =>
    Promise.all([
      db.animal.findFirst({ where: { id } }),
      // Anne adaylari: disi hayvanlar (kendisi haric)
      db.animal.findMany({
        where: { gender: "FEMALE", id: { not: id } },
        select: { id: true, tagNumber: true, name: true },
        orderBy: { tagNumber: "asc" },
      }),
    ])
  );

  if (!animal) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Hayvani Duzenle</h1>
        <Link href="/panel/hayvanlar" className="text-sm text-muted-foreground hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <AnimalForm animal={animal} mothers={mothers} />
    </div>
  );
}
