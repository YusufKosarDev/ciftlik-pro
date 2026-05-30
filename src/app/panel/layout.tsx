import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { PanelNav } from "@/components/panel-nav";
import { roleLabels } from "@/lib/labels";
import { navHrefsFor } from "@/lib/authz";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Asil koruma middleware'de; burada ayrica session verisine erisiyoruz.
  if (!session?.user) {
    redirect("/giris");
  }

  // Tum olasi menu ogeleri; her rol yalnizca yetkili oldugu yollari gorur.
  const allNavItems = [
    { href: "/panel", label: "Panel" },
    { href: "/panel/hayvanlar", label: "Hayvanlar" },
    { href: "/panel/tarlalar", label: "Tarlalar" },
    { href: "/panel/stok", label: "Stok" },
    { href: "/panel/finans", label: "Finans" },
    { href: "/panel/gorevler", label: "Gorevler" },
    { href: "/panel/personel", label: "Personel" },
  ];
  const allowed = navHrefsFor(session.user.role);
  const navItems = allNavItems.filter((item) => allowed.has(item.href));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ust bar */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/panel" className="flex items-center gap-2 text-lg font-bold text-green-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-lg">
                🌾
              </span>
              Ciftlik Pro
            </Link>
            <PanelNav items={navItems} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session.user.name}{" "}
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                {roleLabels[session.user.role]}
              </span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Icerik */}
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
