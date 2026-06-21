"use client";

import type { Role } from "@prisma/client";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { useLabels } from "@/lib/use-labels";
import type { ListState } from "@/lib/list-query";

// Personel listesi parolayi icermez; yalnizca gosterilen alanlar.
export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("tr-TR");
}

export function UsersTable({ users, list }: { users: UserRow[]; list: ListState }) {
  const t = useTranslations("Staff");
  const { roleLabels } = useLabels();

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: t("name"),
      sortKey: "name",
      cell: (u) => <span className="font-medium text-foreground">{u.name}</span>,
    },
    {
      key: "email",
      header: t("email"),
      sortKey: "email",
      cell: (u) => <span className="text-foreground">{u.email}</span>,
    },
    {
      key: "role",
      header: t("role"),
      sortKey: "role",
      cell: (u) => <Badge tone="green">{roleLabels[u.role]}</Badge>,
    },
    {
      key: "createdAt",
      header: t("createdAt"),
      sortKey: "createdAt",
      cell: (u) => <span className="text-muted-foreground">{formatDate(u.createdAt)}</span>,
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      list={list}
      searchable
      searchPlaceholder={t("searchPlaceholder")}
      emptyState={
        <EmptyState icon={<Users className="h-6 w-6" />} title={t("empty")} />
      }
    />
  );
}
