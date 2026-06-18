import Link from "next/link";
import { withTenant } from "@/lib/tenant-prisma";
import { AnimalForm } from "@/components/animal-form";
import { requirePageWrite } from "@/lib/authz";

export default async function YeniHayvanPage() {
  const session = await requirePageWrite("animals");

  // Anne adaylari: disi hayvanlar
  const mothers = await withTenant(session.user.tenantId, (db) =>
    db.animal.findMany({
      where: { gender: "FEMALE" },
      select: { id: true, tagNumber: true, name: true },
      orderBy: { tagNumber: "asc" },
    })
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Yeni Hayvan</h1>
        <Link href="/panel/hayvanlar" className="text-sm text-muted-foreground hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <AnimalForm mothers={mothers} />
    </div>
  );
}
