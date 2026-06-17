"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Sidebar, navIcons, type NavItem } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CommandPalette, type CommandItem } from "@/components/command-palette";
import { Plus } from "lucide-react";

// "Oluştur" kisayollari: ilgili modulun menude (yetkili) olmasi kosuluyla gosterilir.
const createDefs: { need: string; labelKey: string; href: string }[] = [
  { need: "/panel/hayvanlar", labelKey: "newAnimal", href: "/panel/hayvanlar/yeni" },
  { need: "/panel/tarlalar", labelKey: "newField", href: "/panel/tarlalar/yeni" },
  { need: "/panel/stok", labelKey: "newInventory", href: "/panel/stok/yeni" },
  { need: "/panel/finans", labelKey: "newTransaction", href: "/panel/finans/yeni" },
  { need: "/panel/satis", labelKey: "newSale", href: "/panel/satis/yeni" },
  { need: "/panel/musteriler", labelKey: "newCustomer", href: "/panel/musteriler/yeni" },
  { need: "/panel/urunler", labelKey: "newProduct", href: "/panel/urunler/yeni" },
  { need: "/panel/gorevler", labelKey: "newTask", href: "/panel/gorevler/yeni" },
  { need: "/panel/yapilar", labelKey: "newStructure", href: "/panel/yapilar/yeni" },
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
  const tc = useTranslations("Command");

  // Komut listesi: once "Oluştur" eylemleri, sonra "Git" (sayfalar).
  const commands = useMemo<CommandItem[]>(() => {
    const allowed = new Set(navItems.map((i) => i.href));
    const creates: CommandItem[] = createDefs
      .filter((d) => allowed.has(d.need))
      .map((d) => ({
        id: d.href,
        label: tc(d.labelKey),
        group: tc("groupCreate"),
        href: d.href,
        keywords: "ekle yeni create",
        Icon: Plus,
      }));
    const navs: CommandItem[] = navItems.map((i) => ({
      id: i.href,
      label: i.label,
      group: tc("groupGo"),
      href: i.href,
      keywords: "sayfa git go",
      Icon: navIcons[i.href],
    }));
    return [...creates, ...navs];
  }, [navItems, tc]);

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
