import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { parseListParams, type ListState } from "@/lib/list-query";
import { withTenant } from "@/lib/tenant-prisma";
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

  const { users, total } = await withTenant(session!.user.tenantId, async (db) => {
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { [sort]: dir } as Prisma.UserOrderByWithRelationInput,
        skip,
        take,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      db.user.count({ where }),
    ]);
    return { users, total };
  });

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
