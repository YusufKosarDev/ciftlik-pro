"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

export function PanelNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {items.map((item) => {
        // /panel sadece tam eslesmede aktif; digerleri alt yollarda da aktif.
        const isActive =
          item.href === "/panel"
            ? pathname === "/panel"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              isActive
                ? "bg-green-100 text-green-800"
                : "text-gray-600 hover:bg-gray-100 hover:text-green-700"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
