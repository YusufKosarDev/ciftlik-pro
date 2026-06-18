"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, Search } from "lucide-react";
import type { NavItem } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
// NOT: Panel string'lerinin tam cevirisi tamamlanana kadar panel ici dil
// degistirici gizli (karisik-dil gorunmemesi icin). Giris ekrani iki dilli kalir.
// Tamamlandiginda asagidaki <LanguageSwitcher /> geri eklenir.

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
  onOpenCommand,
}: {
  navItems: NavItem[];
  onMenu: () => void;
  onOpenCommand: () => void;
}) {
  const pathname = usePathname();
  const tc = useTranslations("Common");
  const title = titleFor(pathname, navItems);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted lg:hidden"
        aria-label="Menüyü aç"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onOpenCommand}
          className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-muted"
          aria-label="Komut paletini aç"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{tc("search")}</span>
          <kbd className="hidden rounded border border-border px-1 py-0.5 text-[10px] sm:inline">
            ⌘K
          </kbd>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
