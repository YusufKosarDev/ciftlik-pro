import Link from "next/link";
import { notFound } from "next/navigation";
import { withTenant } from "@/lib/tenant-prisma";
import { TaskForm } from "@/components/task-form";
import { requirePageWrite } from "@/lib/authz";
import { getTranslations } from "next-intl/server";

export default async function GorevDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePageWrite("tasks");
  const t = await getTranslations("Tasks");
  const tc = await getTranslations("Common");

  const { id } = await params;
  const [task, users] = await withTenant(session.user.tenantId, (db) =>
    Promise.all([
      db.task.findFirst({ where: { id } }),
      db.user.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ])
  );

  if (!task) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {tc("edit")} - {t("kind")}
        </h1>
        <Link href="/panel/gorevler" className="text-sm text-muted-foreground hover:underline">
          &larr; {tc("backToList")}
        </Link>
      </div>

      <TaskForm task={task} users={users} />
    </div>
  );
}
