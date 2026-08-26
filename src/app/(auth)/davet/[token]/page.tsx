import Link from "next/link";
import { Users, AlertCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getLabels } from "@/lib/get-labels";
import { findInvitationByToken, isInvitationUsable } from "@/lib/invitations";
import { AcceptInviteForm } from "@/components/accept-invite-form";
import { LanguageSwitcher } from "@/components/language-switcher";

// Public davet kabul sayfasi. Daveti token ile okur (Invitation RLS altindadir;
// baglamsiz okuma SECURITY DEFINER fonksiyonuyla yapilir), gecerliyse kabul
// formunu gosterir; degilse bilgilendirir.
export default async function DavetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [t, { roleLabels }] = await Promise.all([getTranslations("Invite"), getLabels()]);
  const invitation = await findInvitationByToken(token);
  const valid = isInvitationUsable(invitation);

  const farm = valid
    ? await prisma.tenant.findUnique({
        where: { id: invitation.tenantId },
        select: { name: true },
      })
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-600 to-emerald-800 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
            <Users className="h-7 w-7" />
          </div>
          {valid ? (
            <>
              <h1 className="text-2xl font-bold text-foreground">{t("joinTitle")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("joinSubtitle", {
                  farm: farm?.name ?? t("unknownFarm"),
                  role: roleLabels[invitation.role],
                })}
              </p>
            </>
          ) : (
            <h1 className="text-2xl font-bold text-foreground">{t("invalidTitle")}</h1>
          )}
        </div>

        {valid ? (
          <AcceptInviteForm token={token} email={invitation.email} />
        ) : (
          <div className="space-y-4">
            <p className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {t("invalidBody")}
            </p>
            <Link
              href="/giris"
              className="block text-center text-sm font-medium text-green-700 dark:text-green-400 hover:underline"
            >
              {t("backToLogin")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
