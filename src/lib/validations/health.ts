import { z } from "zod";
import { requiredDateString } from "@/lib/validations/date";

// Saglik kaydi dogrulama semasi.
export const healthRecordSchema = z.object({
  date: requiredDateString(),
  diagnosis: z
    .string()
    .trim()
    .min(1, "Teshis zorunludur")
    .max(200, "Teshis en fazla 200 karakter olabilir"),
  treatment: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type HealthRecordInput = z.infer<typeof healthRecordSchema>;
