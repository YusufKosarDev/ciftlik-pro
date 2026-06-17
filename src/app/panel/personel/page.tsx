import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseListParams, type ListState } from "@/lib/list-query";
import { UserForm } from "@/components/user-form";
import { UsersTable } from "@/components/tables/users-table";

export default async function PersonelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();

  // Sadece ADMIN bu sayfaya erisebilir (sayfa tarafi koruma)
  if (session?.user.role !== "ADMIN") {
    redirect("/panel");
  }

  const { page, q, sort, dir, skip, take } = parseListParams(await searchParams, {
    sortableKeys: ["name", "email", "role", "createdAt"],
    defaultSort: "createdAt",
    defaultDir: "asc",
  });

  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [sort]: dir } as Prisma.UserOrderByWithRelationInput,
      skip,
      take,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  const list: ListState = { total, page, pageSize: take, q, sort, dir };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <span>👷</span> Personel
        </h1>
        <p className="text-sm text-muted-foreground">Toplam {total} kullanici</p>
      </div>

      <UserForm />

      <UsersTable users={users} list={list} />
    </div>
  );
}
