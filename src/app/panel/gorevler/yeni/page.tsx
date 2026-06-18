import Link from "next/link";
import { withTenant } from "@/lib/tenant-prisma";
import { TaskForm } from "@/components/task-form";
import { requirePageWrite } from "@/lib/authz";

export default async function YeniGorevPage() {
  const session = await requirePageWrite("tasks");

  const users = await withTenant(session.user.tenantId, (db) =>
    db.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Yeni Gorev</h1>
        <Link href="/panel/gorevler" className="text-sm text-muted-foreground hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <TaskForm users={users} />
    </div>
  );
}
