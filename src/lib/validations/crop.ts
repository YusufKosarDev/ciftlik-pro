import { z } from "zod";
import { requiredDateString, optionalDateString } from "@/lib/validations/date";

export const cropStatuses = ["PLANTED", "GROWING", "HARVESTED"] as const;

// Form bos birakilirsa "" gelir; bunu undefined'a cevirip opsiyonel,
// negatif olmayan bir sayi olarak dogrularir.
function optionalNonNegativeNumber(label: string) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce
      .number({ message: `Gecerli bir ${label.toLowerCase()} giriniz` })
      .min(0, `${label} negatif olamaz`)
      .max(1000000000, `${label} cok yuksek`)
      .optional()
  );
}

// Ekim kaydi dogrulama semasi.
export const cropSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Urun adi zorunludur")
    .max(80, "Urun adi en fazla 80 karakter olabilir"),
  plantedDate: requiredDateString("Ekim tarihi zorunludur"),
  harvestDate: optionalDateString(),
  status: z.enum(cropStatuses).default("PLANTED"),
  // Ekonomik alanlar opsiyonel; bos string undefined sayilir.
  cost: optionalNonNegativeNumber("Gider"),
  revenue: optionalNonNegativeNumber("Gelir"),
  yieldAmount: optionalNonNegativeNumber("Verim"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
}).refine(
  // Hasat tarihi doluysa ekim tarihinden once olamaz.
  (d) => !d.harvestDate || new Date(d.harvestDate) >= new Date(d.plantedDate),
  { message: "Hasat tarihi ekim tarihinden once olamaz", path: ["harvestDate"] }
);

export type CropInput = z.infer<typeof cropSchema>;
