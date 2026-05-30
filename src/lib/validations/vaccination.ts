import { z } from "zod";

// Asi kaydi dogrulama semasi.
export const vaccinationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Asi adi zorunludur")
    .max(120, "Asi adi en fazla 120 karakter olabilir"),
  date: z.string().trim().min(1, "Tarih zorunludur"),
  nextDate: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type VaccinationInput = z.infer<typeof vaccinationSchema>;
