import { z } from "zod";
import { requiredDateString, optionalDateString } from "@/lib/validations/date";

export const breedingStatuses = ["PLANNED", "PREGNANT", "BORN", "FAILED"] as const;

// Ureme/gebelik kaydi dogrulama semasi.
export const breedingSchema = z.object({
  sireTag: z.string().trim().max(40).optional().or(z.literal("")),
  breedingDate: requiredDateString("Tohumlama tarihi zorunludur"),
  expectedBirthDate: optionalDateString(),
  actualBirthDate: optionalDateString(),
  status: z.enum(breedingStatuses).default("PLANNED"),
  // Form bos birakilirsa "" gelir; bunu undefined'a cevirip opsiyonel sayariz.
  offspringCount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce
      .number()
      .int("Tam sayi giriniz")
      .min(0, "Negatif olamaz")
      .max(50, "Cok yuksek")
      .optional()
  ),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
})
  .refine(
    // Tahmini dogum tarihi tohumlama tarihinden once olamaz.
    (d) => !d.expectedBirthDate || new Date(d.expectedBirthDate) >= new Date(d.breedingDate),
    { message: "Tahmini dogum tarihi tohumlama tarihinden once olamaz", path: ["expectedBirthDate"] }
  )
  .refine(
    // Gercek dogum tarihi tohumlama tarihinden once olamaz.
    (d) => !d.actualBirthDate || new Date(d.actualBirthDate) >= new Date(d.breedingDate),
    { message: "Gercek dogum tarihi tohumlama tarihinden once olamaz", path: ["actualBirthDate"] }
  );

export type BreedingInput = z.infer<typeof breedingSchema>;
