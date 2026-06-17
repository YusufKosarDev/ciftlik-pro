"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Wheat,
  LayoutDashboard,
  Map as MapIcon,
  CalendarDays,
  Sprout,
  PawPrint,
  Package,
  Warehouse,
  Wallet,
  ListChecks,
  Users,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";

export const navIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/panel": LayoutDashboard,
  "/panel/harita": MapIcon,
  "/panel/takvim": CalendarDays,
  "/panel/hayvanlar": PawPrint,
  "/panel/tarlalar": Wheat,
  "/panel/stok": Package,
  "/panel/yem": Sprout,
  "/panel/yapilar": Warehouse,
  "/panel/finans": Wallet,
  "/panel/gorevler": ListChecks,
  "/panel/personel": Users,
  "/panel/denetim": ClipboardList,
};

// Menuyu mantiksal bolumlere ayiririz; her bolumde yalnizca rolun yetkili oldugu
// (navItems icindeki) yollar gosterilir, bos bolumler gizlenir.
const sections: { title: string; hrefs: string[] }[] = [
  { title: "Genel", hrefs: ["/panel", "/panel/harita", "/panel/takvim"] },
  {
    title: "Operasyon",
    hrefs: ["/panel/hayvanlar", "/panel/tarlalar", "/panel/stok", "/panel/yem", "/panel/yapilar"],
  },
  { title: "Yonetim", hrefs: ["/panel/finans", "/panel/gorevler", "/panel/personel", "/panel/denetim"] },
];

export type NavItem = { href: string; label: string };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Sidebar({
  navItems,
  userName,
  roleLabel,
  onNavigate,
}: {
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const labelOf = new Map(navItems.map((i) => [i.href, i.label]));
  const allowed = new Set(navItems.map((i) => i.href));

  const isActive = (href: string) =>
    href === "/panel" ? pathname === "/panel" : pathname.startsWith(href);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <Link
        href="/panel"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-5 py-4 text-lg font-bold text-foreground"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
          <Wheat className="h-5 w-5" />
        </span>
        Çiftlik Pro
      </Link>

      {/* Navigasyon */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {sections.map((section) => {
          const items = section.hrefs.filter((h) => allowed.has(h));
          if (items.length === 0) return null;
          return (
            <div key={section.title}>
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {items.map((href) => {
                  const Icon = navIcons[href];
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {Icon && (
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition",
                            active ? "text-green-600 dark:text-green-400" : "text-muted-foreground group-hover:text-muted-foreground"
                          )}
                        />
                      )}
                      {labelOf.get(href)}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Kullanici + cikis */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Link
            href="/panel/profil"
            onClick={onNavigate}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-400"
            title="Profil"
          >
            {initials(userName)}
          </Link>
          <Link
            href="/panel/profil"
            onClick={onNavigate}
            className="min-w-0 flex-1"
            title="Profil"
          >
            <p className="truncate text-sm font-medium text-foreground">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/giris" })}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-red-600"
            title="Çıkış yap"
            aria-label="Çıkış yap"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
