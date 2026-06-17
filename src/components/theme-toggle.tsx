"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

// Acik/koyu tema gecis dugmesi. next-themes hidrasyon sonrasi tema bilindiginden
// mounted olana kadar notr bir yer tutucu gosteririz (hidrasyon uyumsuzlugu olmaz).
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // next-themes'in SSR-guvenli kalibi: tema yalnizca istemcide bilindiginden
  // mount sonrasi isaretleriz (hidrasyon uyumsuzlugunu onler).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
      aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      title={isDark ? "Açık tema" : "Koyu tema"}
    >
      {mounted && isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
