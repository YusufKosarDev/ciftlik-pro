import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserForm } from "@/components/user-form";
import { UsersTable } from "@/components/tables/users-table";

export default async function PersonelPage() {
  const session = await auth();

  // Sadece ADMIN bu sayfaya erisebilir (sayfa tarafi koruma)
  if (session?.user.role !== "ADMIN") {
    redirect("/panel");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <span>👷</span> Personel
        </h1>
        <p className="text-sm text-gray-500">Toplam {users.length} kullanici</p>
      </div>

      <UserForm />

      <UsersTable users={users} />
    </div>
  );
}
