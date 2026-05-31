import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { buttonVariants } from "@/components/ui/button";
import { AnimalsTable } from "@/components/tables/animals-table";

export default async function HayvanlarPage() {
  const animals = await prisma.animal.findMany({
    orderBy: { createdAt: "desc" },
  });

  const session = await auth();
  const canEdit = session ? canWrite(session.user.role, "animals") : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <span>🐮</span> Hayvanlar
          </h1>
          <p className="text-sm text-gray-500">Toplam {animals.length} kayit</p>
        </div>
        {canEdit && (
          <Link href="/panel/hayvanlar/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Hayvan
          </Link>
        )}
      </div>

      <AnimalsTable animals={animals} canEdit={canEdit} />
    </div>
  );
}
