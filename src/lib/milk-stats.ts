// Süt verimi kayitlarindan ozet istatistik ve gunluk grafik serisi ureten
// saf, test edilebilir mantik (veritabanindan bagimsiz).

export type MilkYieldLike = { date: Date; amount: number };

export type MilkStats = {
  total: number; // toplam litre
  count: number; // kayit sayisi
  average: number; // kayit basina ortalama
  last7Average: number; // son 7 gun icindeki kayitlarin ortalamasi (kayit basina)
};

// Yerel saatle YYYY-MM-DD anahtari (gun gruplamasi icin).
function dayKey(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function milkStats(
  yields: MilkYieldLike[],
  now: Date = new Date()
): MilkStats {
  const count = yields.length;
  const total = yields.reduce((s, m) => s + m.amount, 0);
  const average = count > 0 ? total / count : 0;

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7 = yields.filter((m) => new Date(m.date) >= sevenDaysAgo);
  const last7Average =
    last7.length > 0
      ? last7.reduce((s, m) => s + m.amount, 0) / last7.length
      : 0;

  return { total, count, average, last7Average };
}

export type MilkDailyPoint = {
  label: string; // "DD.MM" — grafik ekseni icin
  amount: number; // o gunun toplam litresi
};

// Son `days` gunun gunluk toplam verimini (eskiden yeniye) uretir.
// Kaydi olmayan gunler 0 olarak yer alir; bu sayede grafik bosluksuz cizilir.
export function dailyMilkSeries(
  yields: MilkYieldLike[],
  days: number = 14,
  now: Date = new Date()
): MilkDailyPoint[] {
  const totals = new Map<string, number>();
  for (const m of yields) {
    const key = dayKey(new Date(m.date));
    totals.set(key, (totals.get(key) ?? 0) + m.amount);
  }

  const series: MilkDailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const label = `${String(d.getDate()).padStart(2, "0")}.${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;
    series.push({ label, amount: totals.get(key) ?? 0 });
  }
  return series;
}
