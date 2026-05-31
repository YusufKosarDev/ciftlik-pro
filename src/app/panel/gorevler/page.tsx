import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { taskStatusLabels } from "@/lib/labels";
import { DeleteButton } from "@/components/delete-button";

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("tr-TR");
}

// Son tarihi gecmis ve tamamlanmamis gorev mi?
function isOverdue(dueDate: Date | null, status: string): boolean {
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate) < new Date();
}

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
          <Link
            href="/panel/gorevler/yeni"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            + Yeni Gorev
          </Link>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">Henuz gorev eklenmemis.</p>
          {canEdit && (
            <Link
              href="/panel/gorevler/yeni"
              className="mt-3 inline-block text-sm font-medium text-green-600 hover:underline"
            >
              Ilk gorevi ekle
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Baslik</th>
                <th className="px-4 py-3 font-medium">Atanan</th>
                <th className="px-4 py-3 font-medium">Son Tarih</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                {canEdit && (
                  <th className="px-4 py-3 text-right font-medium">Islemler</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);
                return (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {task.title}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {task.assignedTo?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={overdue ? "font-semibold text-red-600" : "text-gray-700"}>
                        {formatDate(task.dueDate)}
                        {overdue && (
                          <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Gecikti
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          statusStyles[task.status]
                        }`}
                      >
                        {taskStatusLabels[task.status]}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`/panel/gorevler/${task.id}/duzenle`}
                            className="text-sm font-medium text-green-600 hover:underline"
                          >
                            Duzenle
                          </Link>
                          <DeleteButton
                          endpoint={`/api/tasks/${task.id}`}
                          itemLabel={task.title}
                          kind="Görev"
                        />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
