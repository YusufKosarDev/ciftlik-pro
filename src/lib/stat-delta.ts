// Dashboard ozet kartlari icin "trend deltasi" etiketleri. Saf fonksiyonlar
// (test edilebilir); gerçek degerler sunucuda Prisma ile hesaplanip buraya verilir.

export type DeltaTone = "up" | "down" | "neutral";
export type StatDelta = { label: string; tone: DeltaTone };

// Bu ay eklenen kayit sayisi (orn. yeni hayvan/tarla).
export function countDelta(thisMonth: number): StatDelta {
  if (thisMonth <= 0) return { label: "bu ay yeni yok", tone: "neutral" };
  return { label: `+${thisMonth} bu ay`, tone: "up" };
}

// Bu ayin net tutari (gelir - gider). Isaret yonu belirler.
export function moneyDelta(net: number, format: (n: number) => string): StatDelta {
  if (net === 0) return { label: "bu ay 0", tone: "neutral" };
  return { label: `${format(Math.abs(net))} bu ay`, tone: net > 0 ? "up" : "down" };
}

// Geciken gorev sayisi (uyari niteliginde; varsa "down" tonu).
export function overdueDelta(count: number): StatDelta {
  if (count <= 0) return { label: "geciken yok", tone: "neutral" };
  return { label: `${count} geciken`, tone: "down" };
}
