"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { filterCommands, type Command } from "@/lib/command-filter";
import { cn } from "@/lib/cn";

export type CommandItem = Command & {
  Icon?: React.ComponentType<{ className?: string }>;
};

// Cmd/Ctrl+K ile acilan hizli gezinme/eylem paleti. Filtreleme mantigi saf
// (lib/command-filter); burada yalnizca UI + klavye gezinmesi var.
export function CommandPalette({
  open,
  onOpenChange,
  commands,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: CommandItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global kisayol: Cmd/Ctrl+K paleti acar/kapatir.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Acilinca girdiye odaklan. Palet her acilista parent tarafindan `key` ile
  // yeniden mount edildiginden query/active zaten sifirdan baslar (effect'te
  // setState yok).
  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  const filtered = useMemo(() => filterCommands(commands, query), [commands, query]);

  if (!open) return null;

  function go(cmd: CommandItem | undefined) {
    if (!cmd) return;
    onOpenChange(false);
    router.push(cmd.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(filtered[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  }

  // Gruplari korumak icin filtrelenmis listeyi sirayla gezerken grup basligini
  // degisince yazariz; aktif index filtrelenmis duz dizi uzerinden ilerler.
  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Komut paleti"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Sayfaya git veya eylem ara..."
            className="w-full bg-transparent py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Eşleşen komut yok.
            </p>
          ) : (
            filtered.map((cmd, i) => {
              const showGroup = cmd.group !== lastGroup;
              lastGroup = cmd.group;
              const Icon = cmd.Icon;
              return (
                <div key={cmd.id}>
                  {showGroup && (
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {cmd.group}
                    </p>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(cmd)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition",
                      i === active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
                    <span className="flex-1 truncate text-foreground">{cmd.label}</span>
                    {i === active && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
