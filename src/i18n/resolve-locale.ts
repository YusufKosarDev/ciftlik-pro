// Aktif dilin secimi — SAF mantik (istek nesnesine bagimli degil, birim testli).
//
// Oncelik sirasi:
//   1. NEXT_LOCALE cookie'si  -> kullanicinin ACIK secimi; her zaman kazanir.
//   2. Accept-Language basligi -> tarayicinin tercihi; ilk ziyaret icin.
//   3. defaultLocale (tr)      -> hicbiri bilgi vermiyorsa.
//
// NEDEN baslik da okunuyor: canli demoya gelen Ingilizce konusan bir ziyaretci,
// once Turkce bir ekranla karsilasip dil degistiriciyi bulmak zorunda kalmasin.
// Cookie yazildigi anda baslik devre disi kalir, yani secim kalicidir.

export const locales = ["tr", "en"] as const;
export const defaultLocale = "tr";
export type Locale = (typeof locales)[number];

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}

// "tr-TR,tr;q=0.9,en-US;q=0.8" -> kalite sirasina gore ilk DESTEKLENEN dil.
// Bolge eki yok sayilir (tr-TR -> tr). Bozuk q degerleri 0 sayilir, yani
// gecerli girisler onlerine gecer.
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
        // Esit kalitede baslikta once gelen kazansin (stabil siralama).
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
