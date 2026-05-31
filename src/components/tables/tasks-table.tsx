"use client";

import Link from "next/link";
import type { Task } from "@prisma/client";
import { CheckSquare } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { taskStatusLabels } from "@/lib/labels";

// Listeleme sayfasi atanan kisinin adini da iceren bir gorev tipi kullanir.
export type TaskRow = Task & { assignedTo: { name: string } | null };

const statusTone = {
  PENDING: "yellow",
  IN_PROGRESS: "blue",
  DONE: "green",
} as const;

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("tr-TR");
}

function isOverdue(dueDate: Date | null, status: string) {
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate) < new Date();
}

export function TasksTable({
  tasks,
  canEdit,
}: {
  tasks: TaskRow[];
  canEdit: boolean;
}) {
  const columns: Column<TaskRow>[] = [
    {
      key: "title",
      header: "Başlık",
      sortValue: (t) => t.title,
      cell: (t) => <span className="font-medium text-gray-900">{t.title}</span>,
    },
    {
      key: "assignedTo",
      header: "Atanan",
      sortValue: (t) => t.assignedTo?.name ?? "",
      cell: (t) => t.assignedTo?.name ?? "-",
    },
    {
      key: "dueDate",
      header: "Son Tarih",
      sortValue: (t) => (t.dueDate ? new Date(t.dueDate).getTime() : 0),
      cell: (t) => {
        const overdue = isOverdue(t.dueDate, t.status);
        return (
          <span className={overdue ? "font-semibold text-red-600" : "text-gray-700"}>
            {formatDate(t.dueDate)}
            {overdue && (
              <Badge tone="red" className="ml-2">
                Gecikti
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Durum",
      sortValue: (t) => t.status,
      cell: (t) => <Badge tone={statusTone[t.status]}>{taskStatusLabels[t.status]}</Badge>,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: "İşlemler",
      headerClassName: "text-right",
      className: "text-right",
      cell: (t) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/gorevler/${t.id}/duzenle`}
            className="text-sm font-medium text-green-600 hover:underline"
          >
            Düzenle
          </Link>
          <DeleteButton endpoint={`/api/tasks/${t.id}`} itemLabel={t.title} kind="Görev" />
        </div>
      ),
    });
  }

  return (
    <DataTable
      data={tasks}
      columns={columns}
      searchableText={(t) => `${t.title} ${t.assignedTo?.name ?? ""}`}
      searchPlaceholder="Başlık veya atanan ara..."
      emptyState={
        <EmptyState
          icon={<CheckSquare className="h-6 w-6" />}
          title="Henüz görev eklenmemiş"
          action={
            canEdit ? (
              <Link href="/panel/gorevler/yeni" className={buttonVariants({ size: "sm" })}>
                Görev ekle
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
