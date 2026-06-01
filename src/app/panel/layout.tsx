import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PanelHeader } from "@/components/panel-header";
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
    { href: "/panel/gorevler", label: "Görevler" },
    { href: "/panel/personel", label: "Personel" },
    { href: "/panel/denetim", label: "Denetim" },
  ];
  const allowed = navHrefsFor(session.user.role);
  const navItems = allNavItems.filter((item) => allowed.has(item.href));

  return (
    <div className="min-h-screen bg-gray-50">
      <PanelHeader
        userName={session.user.name ?? ""}
        roleLabel={roleLabels[session.user.role]}
        navItems={navItems}
      />
      <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
