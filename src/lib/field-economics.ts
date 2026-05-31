// Bir tarlanin ekim kayitlarindan ekonomik ozet ureten saf mantik.
// (Veritabanindan bagimsiz, test edilebilir.)

export type CropEconomicsLike = {
  cost: number | null;
  revenue: number | null;
  yieldAmount: number | null;
};

export type FieldEconomics = {
  totalCost: number; // toplam gider
  totalRevenue: number; // toplam gelir
  profit: number; // gelir - gider
  totalYield: number; // toplam verim (kg)
  yieldPerDonum: number | null; // donum basina verim (alan 0 ise null)
};

export function fieldEconomics(
  crops: CropEconomicsLike[],
  areaDonum: number
): FieldEconomics {
  const totalCost = crops.reduce((s, c) => s + (c.cost ?? 0), 0);
  const totalRevenue = crops.reduce((s, c) => s + (c.revenue ?? 0), 0);
  const totalYield = crops.reduce((s, c) => s + (c.yieldAmount ?? 0), 0);

  return {
    totalCost,
    totalRevenue,
    profit: totalRevenue - totalCost,
    totalYield,
    yieldPerDonum: areaDonum > 0 ? totalYield / areaDonum : null,
  };
}
