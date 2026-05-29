import { z } from "zod";

// Saglik kaydi dogrulama semasi.
export const healthRecordSchema = z.object({
  date: z.string().trim().min(1, "Tarih zorunludur"),
  diagnosis: z
    .string()
    .trim()
    .min(1, "Teshis zorunludur")
    .max(200, "Teshis en fazla 200 karakter olabilir"),
  treatment: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type HealthRecordInput = z.infer<typeof healthRecordSchema>;
