"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Task } from "@prisma/client";
import { CheckSquare } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useLabels } from "@/lib/use-labels";
import type { ListState } from "@/lib/list-query";

// Listeleme sayfasi atanan kisinin adini da iceren bir gorev tipi kullanir.
export type TaskRow = Task & { assignedTo: { name: string } | null };

const statusTone = {
  PENDING: "yellow",
  IN_PROGRESS: "blue",
  DONE: "green",
} as const;

import { useFormat } from "@/lib/format";

function isOverdue(dueDate: Date | null, status: string) {
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate) < new Date();
}

export function TasksTable({
  tasks,
  canEdit,
  list,
}: {
  tasks: TaskRow[];
  canEdit: boolean;
  list: ListState;
}) {
  const t = useTranslations("Tasks");
  const tc = useTranslations("Common");
  const { formatDate } = useFormat();
  const { taskStatusLabels } = useLabels();

  const columns: Column<TaskRow>[] = [
    {
      key: "title",
      header: t("titleLabel"),
      sortKey: "title",
      cell: (tRow) => <span className="font-medium text-foreground">{tRow.title}</span>,
    },
    {
      key: "assignedTo",
      header: t("assignedTo"),
      sortKey: "assignedTo",
      cell: (tRow) => tRow.assignedTo?.name ?? "-",
    },
    {
      key: "dueDate",
      header: t("dueDate"),
      sortKey: "dueDate",
      cell: (tRow) => {
        const overdue = isOverdue(tRow.dueDate, tRow.status);
        return (
          <span className={overdue ? "font-semibold text-red-600" : "text-foreground"}>
            {formatDate(tRow.dueDate)}
            {overdue && (
              <Badge tone="red" className="ml-2">
                {t("overdue")}
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      key: "status",
      header: t("status"),
      sortKey: "status",
      cell: (tRow) => <Badge tone={statusTone[tRow.status]}>{taskStatusLabels[tRow.status]}</Badge>,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: tc("actions"),
      headerClassName: "text-right",
      className: "text-right",
      cell: (tRow) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/gorevler/${tRow.id}/duzenle`}
            className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
          >
            {tc("edit")}
          </Link>
          <DeleteButton endpoint={`/api/tasks/${tRow.id}`} itemLabel={tRow.title} kind={t("kind")} />
        </div>
      ),
    });
  }

  return (
    <DataTable
      data={tasks}
      columns={columns}
      list={list}
      searchable
      searchPlaceholder={t("searchPlaceholder")}
      emptyState={
        <EmptyState
          icon={<CheckSquare className="h-6 w-6" />}
          title={t("empty")}
          action={
            canEdit ? (
              <Link href="/panel/gorevler/yeni" className={buttonVariants({ size: "sm" })}>
                {t("add")}
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
