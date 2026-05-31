import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { buttonVariants } from "@/components/ui/button";
import { TasksTable } from "@/components/tables/tasks-table";

export default async function GorevlerPage() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    include: { assignedTo: { select: { name: true } } },
  });

  const session = await auth();
  const canEdit = session ? canWrite(session.user.role, "tasks") : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <span>✅</span> Gorevler
          </h1>
          <p className="text-sm text-gray-500">Toplam {tasks.length} gorev</p>
        </div>
        {canEdit && (
          <Link href="/panel/gorevler/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Gorev
          </Link>
        )}
      </div>

      <TasksTable tasks={tasks} canEdit={canEdit} />
    </div>
  );
}
