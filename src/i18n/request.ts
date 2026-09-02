import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { resolveLocale } from "@/i18n/resolve-locale";

// We do NOT use i18n routing (there is no /tr or /en in the URL). The locale comes
// from the NEXT_LOCALE cookie first, then the browser's Accept-Language header,
// and finally the default (tr). The selection logic is pure and unit tested:
// src/i18n/resolve-locale.ts
//
// Pages are already dynamic because cookies() is read, so adding the header does
// not change the caching behaviour.
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
