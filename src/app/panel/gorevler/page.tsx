import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { buttonVariants } from "@/components/ui/button";
import { TasksTable } from "@/components/tables/tasks-table";

export default async function GorevlerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, q, sort, dir, skip, take } = parseListParams(await searchParams, {
    sortableKeys: ["title", "assignedTo", "dueDate", "status"],
    defaultSort: "createdAt",
    defaultDir: "desc",
  });

  const where: Prisma.TaskWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { assignedTo: { name: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  // Atanan kisiye gore siralama iliskili tablo uzerinden yapilir.
  const orderBy = (
    sort === "assignedTo" ? { assignedTo: { name: dir } } : { [sort]: dir }
  ) as Prisma.TaskOrderByWithRelationInput;

  const [tasks, total, session] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { assignedTo: { select: { name: true } } },
    }),
    prisma.task.count({ where }),
    auth(),
  ]);

  const canEdit = session ? canWrite(session.user.role, "tasks") : false;
  const list: ListState = { total, page, pageSize: take, q, sort, dir };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span>✅</span> Gorevler
          </h1>
          <p className="text-sm text-muted-foreground">Toplam {total} gorev</p>
        </div>
        {canEdit && (
          <Link href="/panel/gorevler/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Gorev
          </Link>
        )}
      </div>

      <TasksTable tasks={tasks} canEdit={canEdit} list={list} />
    </div>
  );
}
