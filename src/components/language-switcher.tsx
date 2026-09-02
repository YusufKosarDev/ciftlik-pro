"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { cn } from "@/lib/cn";

// The routing-free language switcher: it writes the choice to the NEXT_LOCALE
// cookie and refreshes the server components (router.refresh). The URL does not
// change.
export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Language");
  const [pending, startTransition] = useTransition();

  function choose(next: "tr" | "en") {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      className={cn("inline-flex items-center rounded-lg border border-border p-0.5 text-xs", className)}
      role="group"
      aria-label={t("aria")}
    >
      {(["tr", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => choose(code)}
          disabled={pending}
          aria-pressed={locale === code}
          className={cn(
            "rounded-md px-2 py-1 font-medium uppercase transition disabled:opacity-60",
            locale === code
              ? "bg-green-700 text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
