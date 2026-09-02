import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { PasswordChangeForm } from "@/components/password-change-form";
import { RestartTourButton } from "@/components/restart-tour-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AccountDangerZone } from "@/components/account-danger-zone";
import { getTranslations } from "next-intl/server";
import { getLabels } from "@/lib/get-labels";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/giris");
  }

  const t = await getTranslations("Profile");
  const { roleLabels } = await getLabels();

  // Account (tenant) actions are shown only to an ADMIN.
  const isAdmin = session.user.role === "ADMIN";
  const tenant = isAdmin
    ? await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, plan: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
        <span>👤</span> {t("title")}
      </h1>

      <div className="rounded-xl border border-border bg-card p-6">
        <Row label={t("name")} value={session.user.name ?? "-"} />
        <Row label={t("email")} value={session.user.email ?? "-"} />
        <Row label={t("role")} value={roleLabels[session.user.role]} />
      </div>

      {isAdmin && tenant && (
        <Link
          href="/panel/abonelik"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition hover:border-green-400 hover:shadow-sm"
        >
          <div>
            <p className="font-medium text-foreground">{t("billingPlan")}</p>
            <p className="text-sm text-muted-foreground">{t("billingPlanDesc")}</p>
          </div>
          <Badge tone={tenant.plan === "PRO" ? "green" : "blue"}>{tenant.plan}</Badge>
        </Link>
      )}

      {/* Language choice: the switcher in the top bar is hidden on narrow screens,
          so this is its permanent home. */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="font-semibold text-foreground">{t("language")}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("languageDesc")}</p>
        </div>
        <LanguageSwitcher />
      </div>

      <PasswordChangeForm />

      <RestartTourButton />

      {isAdmin && tenant && (
        <AccountDangerZone
          farmName={tenant.name}
          canDelete={session.user.tenantId !== "default-tenant"}
        />
      )}
    </div>
  );
}
