import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { parseListParams, type ListState } from "@/lib/list-query";
import { withTenant } from "@/lib/tenant-prisma";
import { roleLabels } from "@/lib/labels";
import { UserForm } from "@/components/user-form";
import { UsersTable } from "@/components/tables/users-table";
import { InviteForm } from "@/components/invite-form";
import { DeleteButton } from "@/components/delete-button";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("tr-TR");
}

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

  const { users, total, invitations } = await withTenant(session!.user.tenantId, async (db) => {
    const [users, total, invitations] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { [sort]: dir } as Prisma.UserOrderByWithRelationInput,
        skip,
        take,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      db.user.count({ where }),
      // Bekleyen (kabul edilmemis, suresi gecmemis) davetler.
      db.invitation.findMany({
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { users, total, invitations };
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

      <InviteForm />

      {invitations.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold text-foreground">
            Bekleyen davetler ({invitations.length})
          </h3>
          <ul className="divide-y divide-border">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium text-foreground">{inv.email}</span>
                  <span className="ml-2 text-muted-foreground">
                    {roleLabels[inv.role]} · son geçerlilik {formatDate(inv.expiresAt)}
                  </span>
                </div>
                <DeleteButton
                  endpoint={`/api/invitations/${inv.id}`}
                  itemLabel={inv.email}
                  kind="Davet"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <UserForm />

      <UsersTable users={users} list={list} />
    </div>
  );
}
