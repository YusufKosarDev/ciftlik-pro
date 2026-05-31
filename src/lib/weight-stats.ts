// Agirlik (tartim) kayitlarindan ozet ve grafik serisi ureten saf, test
// edilebilir mantik (veritabanindan bagimsiz).

export type WeightRecordLike = { date: Date; weightKg: number };

export type WeightStats = {
  count: number;
  latest: number | null; // en guncel tartim
  first: number | null; // en eski tartim
  change: number | null; // latest - first (kilo degisimi)
};

function byDateAsc(a: WeightRecordLike, b: WeightRecordLike): number {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

export function weightStats(records: WeightRecordLike[]): WeightStats {
  if (records.length === 0) {
    return { count: 0, latest: null, first: null, change: null };
  }
  const sorted = [...records].sort(byDateAsc);
  const first = sorted[0].weightKg;
  const latest = sorted[sorted.length - 1].weightKg;
  return {
    count: records.length,
    latest,
    first,
    change: latest - first,
  };
}

export type WeightPoint = {
  label: string; // "DD.MM" — grafik ekseni icin
  weight: number;
};

// Kayitlari tarihe gore (eskiden yeniye) grafik noktalarina cevirir.
export function weightSeries(records: WeightRecordLike[]): WeightPoint[] {
  return [...records].sort(byDateAsc).map((r) => {
    const d = new Date(r.date);
    const label = `${String(d.getDate()).padStart(2, "0")}.${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;
    return { label, weight: r.weightKg };
  });
}
