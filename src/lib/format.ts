import { useLocale } from "next-intl";

export function formatDate(d: Date | string | number | null | undefined, locale: string = "tr") {
  if (!d) return "-";
  return new Date(d).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US");
}

export function formatMoney(amount: number | null | undefined, locale: string = "tr") {
  if (amount == null) return "-";
  return amount.toLocaleString(locale === "tr" ? "tr-TR" : "en-US", {
    minimumFractionDigits: 2,
  }) + " TL";
}

export function useFormat() {
  const locale = useLocale();

  return {
    formatDate: (d: Date | string | number | null | undefined) => formatDate(d, locale),
    formatMoney: (amount: number | null | undefined) => formatMoney(amount, locale),
  };
}
