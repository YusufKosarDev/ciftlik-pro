import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { roleLabels } from "@/lib/labels";
import { PasswordChangeForm } from "@/components/password-change-form";
import { RestartTourButton } from "@/components/restart-tour-button";

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

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
        <span>👤</span> Profil
      </h1>

      <div className="rounded-xl border border-border bg-card p-6">
        <Row label="Ad" value={session.user.name ?? "-"} />
        <Row label="E-posta" value={session.user.email ?? "-"} />
        <Row label="Rol" value={roleLabels[session.user.role]} />
      </div>

      <PasswordChangeForm />

      <RestartTourButton />
    </div>
  );
}
