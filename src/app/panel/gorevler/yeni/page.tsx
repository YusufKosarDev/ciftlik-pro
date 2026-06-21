import Link from "next/link";
import { withTenant } from "@/lib/tenant-prisma";
import { TaskForm } from "@/components/task-form";
import { requirePageWrite } from "@/lib/authz";
import { getTranslations } from "next-intl/server";

export default async function YeniGorevPage() {
  const session = await requirePageWrite("tasks");
  const t = await getTranslations("Tasks");
  const tc = await getTranslations("Common");

  const users = await withTenant(session.user.tenantId, (db) =>
    db.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("new")}</h1>
        <Link href="/panel/gorevler" className="text-sm text-muted-foreground hover:underline">
          &larr; {tc("backToList")}
        </Link>
      </div>

      <TaskForm users={users} />
    </div>
  );
}
