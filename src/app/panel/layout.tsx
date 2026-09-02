import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { PanelShell } from "@/components/panel-shell";
import { OnboardingModal } from "@/components/onboarding-modal";
import { getLabels } from "@/lib/get-labels";
import { navHrefsFor } from "@/lib/authz";

// Menu path -> translation key (the order here is the display order).
const navKeys: Record<string, string> = {
  "/panel": "panel",
  "/panel/harita": "map",
  "/panel/takvim": "calendar",
  "/panel/hayvanlar": "animals",
  "/panel/tarlalar": "fields",
  "/panel/stok": "inventory",
  "/panel/yem": "feed",
  "/panel/yapilar": "structures",
  "/panel/finans": "finance",
  "/panel/satis": "sales",
  "/panel/musteriler": "customers",
  "/panel/urunler": "products",
  "/panel/siparisler": "orders",
  "/panel/gorevler": "tasks",
  "/panel/personel": "staff",
  "/panel/denetim": "audit",
};

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // The real guard is in the proxy; here we additionally read the session data.
  if (!session?.user) {
    redirect("/giris");
  }

  // Every possible menu item; each role sees only the paths it is allowed.
  const t = await getTranslations("Nav");
  // The role label comes from the translated source rather than a hard-coded
  // Turkish labels.ts, so the sidebar stays correct after switching to English.
  const { roleLabels } = await getLabels();
  const allNavItems = Object.entries(navKeys).map(([href, key]) => ({
    href,
    label: t(key),
  }));
  const allowed = navHrefsFor(session.user.role);
  const navItems = allNavItems.filter((item) => allowed.has(item.href));

  // The welcome tour: the modal is shown when the user has not completed it yet.
  // The state is read from the JWT, so there is no extra database query on every
  // navigation; when the tour finishes, OnboardingModal refreshes the token with
  // useSession().update.
  const showOnboarding = !session.user.onboarded;

  return (
    <>
      <PanelShell
        userName={session.user.name ?? ""}
        roleLabel={roleLabels[session.user.role]}
        navItems={navItems}
      >
        {children}
      </PanelShell>
      {showOnboarding && (
        <OnboardingModal
          userName={session.user.name ?? ""}
          role={session.user.role}
        />
      )}
    </>
  );
}
