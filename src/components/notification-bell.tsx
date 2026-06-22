"use client";

import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  href: string;
};

type NotificationsData = {
  criticalStock: NotificationItem[];
  overdueTasks: NotificationItem[];
  upcomingVaccinations: NotificationItem[];
};

export function NotificationBell() {
  const [data, setData] = useState<NotificationsData>({
    criticalStock: [],
    overdueTasks: [],
    upcomingVaccinations: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Bildirimler yüklenemedi:", err);
      }
    }

    fetchNotifications();

    // Click outside listener
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalCount =
    data.criticalStock.length + data.overdueTasks.length + data.upcomingVaccinations.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-muted cursor-pointer"
        aria-label="Bildirimler"
      >
        <Bell className="h-5 w-5" />
        {totalCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-card animate-pulse">
            {totalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 max-h-[420px] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-b border-border px-3 py-2">
            <h4 className="font-bold text-sm text-foreground">Bildirimler ({totalCount})</h4>
          </div>

          <div className="divide-y divide-border text-xs">
            {totalCount === 0 ? (
              <p className="px-3 py-6 text-center text-muted-foreground">Aktif bildiriminiz bulunmuyor.</p>
            ) : (
              <>
                {/* Kritik Stoklar */}
                {data.criticalStock.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2.5 hover:bg-muted transition"
                  >
                    <p className="font-semibold text-red-600 dark:text-red-400">📦 {item.title}</p>
                    <p className="text-muted-foreground mt-0.5">{item.description}</p>
                  </Link>
                ))}

                {/* Geciken Görevler */}
                {data.overdueTasks.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2.5 hover:bg-muted transition"
                  >
                    <p className="font-semibold text-amber-600 dark:text-amber-400">⏰ {item.title}</p>
                    <p className="text-muted-foreground mt-0.5">{item.description}</p>
                  </Link>
                ))}

                {/* Yaklaşan Aşılar */}
                {data.upcomingVaccinations.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2.5 hover:bg-muted transition"
                  >
                    <p className="font-semibold text-blue-600 dark:text-blue-400">💉 {item.title}</p>
                    <p className="text-muted-foreground mt-0.5">{item.description}</p>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
