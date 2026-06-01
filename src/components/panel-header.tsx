"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wheat,
  LayoutDashboard,
  Map,
  CalendarDays,
  Sprout,
  PawPrint,
  Package,
  Warehouse,
  Wallet,
  ListChecks,
  Users,
  ClipboardList,
  Menu,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/panel": LayoutDashboard,
  "/panel/harita": Map,
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

type NavItem = { href: string; label: string };

export function PanelHeader({
  userName,
  roleLabel,
  navItems,
}: {
  userName: string;
  roleLabel: string;
  navItems: NavItem[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/panel" ? pathname === "/panel" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/panel"
            className="flex items-center gap-2 text-lg font-bold text-green-700"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <Wheat className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline">Çiftlik Pro</span>
          </Link>

          {/* Masaüstü navigasyon */}
          <nav className="hidden items-center gap-1 text-sm lg:flex">
            {navItems.map((item) => {
              const Icon = icons[item.href];
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition",
                    active
                      ? "bg-green-100 text-green-800"
                      : "text-gray-600 hover:bg-gray-100 hover:text-green-700"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/panel/profil"
            className="hidden items-center gap-2 text-sm text-gray-600 transition hover:text-green-700 sm:flex"
            title="Profil"
          >
            {userName}
            <Badge tone="green">{roleLabel}</Badge>
          </Link>
          <div className="hidden sm:block">
            <LogoutButton />
          </div>
          {/* Mobil menü düğmesi */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Menü"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobil menü */}
      {open && (
        <nav className="space-y-1 border-t border-gray-200 bg-white px-4 py-2 lg:hidden">
          <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-2 sm:hidden">
            <Link
              href="/panel/profil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              {userName}
              <Badge tone="green">{roleLabel}</Badge>
            </Link>
            <LogoutButton />
          </div>
          {navItems.map((item) => {
            const Icon = icons[item.href];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-green-100 text-green-800"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
