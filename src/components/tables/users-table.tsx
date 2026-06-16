"use client";

import type { Role } from "@prisma/client";
import { Users } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { roleLabels } from "@/lib/labels";
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
  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: "Ad",
      sortKey: "name",
      cell: (u) => <span className="font-medium text-gray-900">{u.name}</span>,
    },
    {
      key: "email",
      header: "E-posta",
      sortKey: "email",
      cell: (u) => <span className="text-gray-700">{u.email}</span>,
    },
    {
      key: "role",
      header: "Rol",
      sortKey: "role",
      cell: (u) => <Badge tone="green">{roleLabels[u.role]}</Badge>,
    },
    {
      key: "createdAt",
      header: "Kayıt",
      sortKey: "createdAt",
      cell: (u) => <span className="text-gray-500">{formatDate(u.createdAt)}</span>,
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      list={list}
      searchable
      searchPlaceholder="Ad veya e-posta ara..."
      emptyState={
        <EmptyState icon={<Users className="h-6 w-6" />} title="Henüz personel yok" />
      }
    />
  );
}
