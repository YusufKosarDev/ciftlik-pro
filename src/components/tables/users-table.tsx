"use client";

import type { Role } from "@prisma/client";
import { Users } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { roleLabels } from "@/lib/labels";

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

export function UsersTable({ users }: { users: UserRow[] }) {
  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: "Ad",
      sortValue: (u) => u.name,
      cell: (u) => <span className="font-medium text-gray-900">{u.name}</span>,
    },
    {
      key: "email",
      header: "E-posta",
      sortValue: (u) => u.email,
      cell: (u) => <span className="text-gray-700">{u.email}</span>,
    },
    {
      key: "role",
      header: "Rol",
      sortValue: (u) => roleLabels[u.role],
      cell: (u) => <Badge tone="green">{roleLabels[u.role]}</Badge>,
    },
    {
      key: "createdAt",
      header: "Kayıt",
      sortValue: (u) => new Date(u.createdAt).getTime(),
      cell: (u) => <span className="text-gray-500">{formatDate(u.createdAt)}</span>,
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      searchableText={(u) => `${u.name} ${u.email} ${roleLabels[u.role]}`}
      searchPlaceholder="Ad, e-posta veya rol ara..."
      emptyState={
        <EmptyState icon={<Users className="h-6 w-6" />} title="Henüz personel yok" />
      }
    />
  );
}
