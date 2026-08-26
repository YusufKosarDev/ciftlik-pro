import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { resolveLocale } from "@/i18n/resolve-locale";

// i18n routing KULLANMIYORUZ (URL'de /tr, /en yok). Dil once NEXT_LOCALE
// cookie'sinden, o yoksa tarayicinin Accept-Language basligindan, hicbiri
// bilgi vermiyorsa varsayilandan (tr) secilir. Secim mantigi saf ve birim
// testli: src/i18n/resolve-locale.ts
//
// Sayfalar zaten cookies() okundugu icin dinamik; baslik eklemek onbellek
// davranisini degistirmez.
export { locales, defaultLocale, type Locale } from "@/i18n/resolve-locale";

export default getRequestConfig(async () => {
  const [store, headerList] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(
    store.get("NEXT_LOCALE")?.value,
    headerList.get("accept-language")
  );

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
