import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { buttonVariants } from "@/components/ui/button";
import { FieldsTable } from "@/components/tables/fields-table";

export default async function TarlalarPage() {
  const fields = await prisma.field.findMany({
    orderBy: { createdAt: "desc" },
  });

  const session = await auth();
  const canEdit = session ? canWrite(session.user.role, "fields") : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <span>🌾</span> Tarlalar
          </h1>
          <p className="text-sm text-gray-500">Toplam {fields.length} kayit</p>
        </div>
        {canEdit && (
          <Link href="/panel/tarlalar/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Tarla
          </Link>
        )}
      </div>

      <FieldsTable fields={fields} canEdit={canEdit} />
    </div>
  );
}
