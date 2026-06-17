import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { PanelShell } from "@/components/panel-shell";
import { OnboardingModal } from "@/components/onboarding-modal";
import { roleLabels } from "@/lib/labels";
import { navHrefsFor } from "@/lib/authz";

// Menu yolu -> ceviri anahtari (sira = goruntuleme sirasi).
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

  // Asıl koruma proxy'de; burada ayrıca session verisine erişiyoruz.
  if (!session?.user) {
    redirect("/giris");
  }

  // Tüm olası menü öğeleri; her rol yalnızca yetkili olduğu yolları görür.
  const t = await getTranslations("Nav");
  const allNavItems = Object.entries(navKeys).map(([href, key]) => ({
    href,
    label: t(key),
  }));
  const allowed = navHrefsFor(session.user.role);
  const navItems = allNavItems.filter((item) => allowed.has(item.href));

  // Hos geldin turu: kullanici turu henuz tamamlamadiysa modal gosterilir.
  // Durum JWT'den okunur (her gezinmede ekstra DB sorgusu yok); tur tamamlaninca
  // OnboardingModal useSession().update ile token'i tazeler.
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
