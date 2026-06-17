"use client";

import { useState } from "react";
import { Sidebar, type NavItem } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

// Panel duzeni: solda sabit sidebar (masaustu) / cekmece (mobil) + ust bar +
// icerik. Mobil cekmece durumu burada (client) tutulur; layout sunucu bileseni
// oldugundan veri prop olarak gelir.
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
        <Topbar navItems={navItems} onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
