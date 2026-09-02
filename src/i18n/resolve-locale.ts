// Choosing the active locale — PURE logic (no dependency on the request object,
// and unit tested).
//
// Priority:
//   1. The NEXT_LOCALE cookie   -> the user's EXPLICIT choice; always wins.
//   2. The Accept-Language header -> the browser's preference, for a first visit.
//   3. defaultLocale (tr)        -> when neither says anything.
//
// WHY the header is read at all: an English-speaking visitor arriving at the live
// demo should not have to meet a Turkish screen first and go hunting for the
// language switcher. The moment a cookie is written the header stops mattering, so
// the choice sticks.

export const locales = ["tr", "en"] as const;
export const defaultLocale = "tr";
export type Locale = (typeof locales)[number];

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}

// "tr-TR,tr;q=0.9,en-US;q=0.8" -> the first SUPPORTED language by quality order.
// The region suffix is ignored (tr-TR -> tr). A malformed q counts as 0, so valid
// entries take precedence over it.
function fromAcceptLanguage(header: string | undefined | null): Locale | undefined {
  if (!header) return undefined;

  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      const quality = q === undefined ? 1 : Number.parseFloat(q);
      return {
        base: tag.trim().toLowerCase().split("-")[0],
        quality: Number.isFinite(quality) ? quality : 0,
        // On equal quality the one listed first wins (a stable sort).
        index,
      };
    })
    .filter((entry) => entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  return ranked.find((entry) => isLocale(entry.base))?.base as Locale | undefined;
}

export function resolveLocale(
  cookieValue: string | undefined | null,
  acceptLanguage?: string | undefined | null
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  return fromAcceptLanguage(acceptLanguage) ?? defaultLocale;
}
