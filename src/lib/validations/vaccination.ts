import { z } from "zod";
import { requiredDateString, optionalDateString } from "@/lib/validations/date";

// Asi kaydi dogrulama semasi.
export const vaccinationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Asi adi zorunludur")
    .max(120, "Asi adi en fazla 120 karakter olabilir"),
  date: requiredDateString(),
  nextDate: optionalDateString(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type VaccinationInput = z.infer<typeof vaccinationSchema>;
