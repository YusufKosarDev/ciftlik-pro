"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { NavItem } from "@/components/sidebar";

// Aktif yola gore sayfa basligini bulur (en uzun eslesen on-ek).
function titleFor(pathname: string, navItems: NavItem[]): string {
  let best: NavItem | undefined;
  for (const item of navItems) {
    const match = item.href === "/panel" ? pathname === "/panel" : pathname.startsWith(item.href);
    if (match && (!best || item.href.length > best.href.length)) best = item;
  }
  return best?.label ?? "Panel";
}

export function Topbar({
  navItems,
  onMenu,
}: {
  navItems: NavItem[];
  onMenu: () => void;
}) {
  const pathname = usePathname();
  const title = titleFor(pathname, navItems);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        aria-label="Menüyü aç"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
    </header>
  );
}
