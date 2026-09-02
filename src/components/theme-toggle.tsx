"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Sun, Moon } from "lucide-react";

// The light/dark theme toggle. With next-themes the theme is only known after
// hydration, so a neutral placeholder is shown until mount — which avoids a
// hydration mismatch.
export function ThemeToggle() {
  const t = useTranslations("Common");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // The SSR-safe next-themes pattern: the theme is known only on the client, so the
  // flag is set after mount (which prevents a hydration mismatch).
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
