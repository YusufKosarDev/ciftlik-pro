import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PanelShell } from "@/components/panel-shell";
import { OnboardingModal } from "@/components/onboarding-modal";
import { roleLabels } from "@/lib/labels";
import { navHrefsFor } from "@/lib/authz";

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
  const allNavItems = [
    { href: "/panel", label: "Panel" },
    { href: "/panel/harita", label: "Harita" },
    { href: "/panel/takvim", label: "Takvim" },
    { href: "/panel/hayvanlar", label: "Hayvanlar" },
    { href: "/panel/tarlalar", label: "Tarlalar" },
    { href: "/panel/stok", label: "Stok" },
    { href: "/panel/yem", label: "Yem" },
    { href: "/panel/yapilar", label: "Yapılar" },
    { href: "/panel/finans", label: "Finans" },
    { href: "/panel/satis", label: "Satış" },
    { href: "/panel/musteriler", label: "Müşteriler" },
    { href: "/panel/urunler", label: "Ürünler" },
    { href: "/panel/siparisler", label: "Siparişler" },
    { href: "/panel/gorevler", label: "Görevler" },
    { href: "/panel/personel", label: "Personel" },
    { href: "/panel/denetim", label: "Denetim" },
  ];
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
