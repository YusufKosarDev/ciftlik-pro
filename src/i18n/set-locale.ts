"use server";

import { cookies } from "next/headers";
import { locales, type Locale } from "@/i18n/request";

// Dil secimini NEXT_LOCALE cookie'sine sunucuda yazar (routing'siz i18n).
export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) return;
  const store = await cookies();
  store.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
