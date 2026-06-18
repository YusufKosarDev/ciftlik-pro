import Link from "next/link";
import { Users, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { roleLabels } from "@/lib/labels";
import { AcceptInviteForm } from "@/components/accept-invite-form";

// Public davet kabul sayfasi. Daveti token ile okur (Invitation RLS disi),
// gecerliyse kabul formunu gosterir; degilse bilgilendirir.
export default async function DavetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  const valid =
    invitation && !invitation.acceptedAt && invitation.expiresAt > new Date();

  const farm = valid
    ? await prisma.tenant.findUnique({
        where: { id: invitation.tenantId },
        select: { name: true },
      })
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-600 to-emerald-800 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
            <Users className="h-7 w-7" />
          </div>
          {valid ? (
            <>
              <h1 className="text-2xl font-bold text-foreground">Ekibe katıl</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{farm?.name ?? "Bir çiftlik"}</span>{" "}
                ekibine <span className="font-medium text-foreground">{roleLabels[invitation.role]}</span>{" "}
                olarak davet edildiniz.
              </p>
            </>
          ) : (
            <h1 className="text-2xl font-bold text-foreground">Davet geçersiz</h1>
          )}
        </div>

        {valid ? (
          <AcceptInviteForm token={token} email={invitation.email} />
        ) : (
          <div className="space-y-4">
            <p className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Bu davet bağlantısı geçersiz, süresi dolmuş veya zaten kullanılmış.
            </p>
            <Link
              href="/giris"
              className="block text-center text-sm font-medium text-green-700 dark:text-green-400 hover:underline"
            >
              Giriş sayfasına dön
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
