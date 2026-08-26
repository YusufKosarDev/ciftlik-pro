"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Sun, Moon } from "lucide-react";

// Acik/koyu tema gecis dugmesi. next-themes hidrasyon sonrasi tema bilindiginden
// mounted olana kadar notr bir yer tutucu gosteririz (hidrasyon uyumsuzlugu olmaz).
export function ThemeToggle() {
  const t = useTranslations("Common");
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
      aria-label={isDark ? t("toLightTheme") : t("toDarkTheme")}
      title={isDark ? t("lightTheme") : t("darkTheme")}
    >
      {mounted && isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
