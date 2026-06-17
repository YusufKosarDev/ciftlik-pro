import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

// i18n routing KULLANMIYORUZ (URL'de /tr, /en yok). Locale bir cookie'den
// (NEXT_LOCALE) okunur; yoksa varsayilan Turkce. Boylece mevcut rotalar ve
// canli demo varsayilani degismez.
export const locales = ["tr", "en"] as const;
export const defaultLocale = "tr";
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("NEXT_LOCALE")?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
