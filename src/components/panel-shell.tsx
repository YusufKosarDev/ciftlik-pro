"use client";

import { useMemo, useState } from "react";
import { Sidebar, navIcons, type NavItem } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CommandPalette, type CommandItem } from "@/components/command-palette";
import { Plus } from "lucide-react";

// "Oluştur" kisayollari: ilgili modulun menude (yetkili) olmasi kosuluyla gosterilir.
const createDefs: { need: string; label: string; href: string }[] = [
  { need: "/panel/hayvanlar", label: "Yeni Hayvan", href: "/panel/hayvanlar/yeni" },
  { need: "/panel/tarlalar", label: "Yeni Tarla", href: "/panel/tarlalar/yeni" },
  { need: "/panel/stok", label: "Yeni Stok Kalemi", href: "/panel/stok/yeni" },
  { need: "/panel/finans", label: "Yeni İşlem", href: "/panel/finans/yeni" },
  { need: "/panel/satis", label: "Yeni Satış", href: "/panel/satis/yeni" },
  { need: "/panel/gorevler", label: "Yeni Görev", href: "/panel/gorevler/yeni" },
  { need: "/panel/yapilar", label: "Yeni Yapı", href: "/panel/yapilar/yeni" },
];

// Panel duzeni: solda sabit sidebar (masaustu) / cekmece (mobil) + ust bar +
// icerik. Mobil cekmece ve komut paleti durumu burada (client) tutulur; layout
// sunucu bileseni oldugundan veri prop olarak gelir.
export function PanelShell({
  navItems,
  userName,
  roleLabel,
  children,
}: {
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // Komut listesi: once "Oluştur" eylemleri, sonra "Git" (sayfalar).
  const commands = useMemo<CommandItem[]>(() => {
    const allowed = new Set(navItems.map((i) => i.href));
    const creates: CommandItem[] = createDefs
      .filter((d) => allowed.has(d.need))
      .map((d) => ({
        id: d.href,
        label: d.label,
        group: "Oluştur",
        href: d.href,
        keywords: "ekle yeni oluştur",
        Icon: Plus,
      }));
    const navs: CommandItem[] = navItems.map((i) => ({
      id: i.href,
      label: i.label,
      group: "Git",
      href: i.href,
      keywords: "sayfa git",
      Icon: navIcons[i.href],
    }));
    return [...creates, ...navs];
  }, [navItems]);

  return (
    <div className="min-h-screen bg-background">
      {/* Masaustu: sabit sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">
        <Sidebar navItems={navItems} userName={userName} roleLabel={roleLabel} />
      </div>

      {/* Mobil: cekmece */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0">
            <Sidebar
              navItems={navItems}
              userName={userName}
              roleLabel={roleLabel}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Icerik kolonu */}
      <div className="lg:pl-64">
        <Topbar
          navItems={navItems}
          onMenu={() => setMobileOpen(true)}
          onOpenCommand={() => setCmdOpen(true)}
        />
        <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
      </div>

      <CommandPalette
        key={cmdOpen ? "cmd-open" : "cmd-closed"}
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        commands={commands}
      />
    </div>
  );
}
