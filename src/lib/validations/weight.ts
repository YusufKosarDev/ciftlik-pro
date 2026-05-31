import { z } from "zod";
import { requiredDateString } from "@/lib/validations/date";

// Agirlik (tartim) kaydi dogrulama semasi.
export const weightSchema = z.object({
  date: requiredDateString(),
  weightKg: z.coerce
    .number({ message: "Gecerli bir agirlik giriniz" })
    .positive("Agirlik 0'dan buyuk olmalidir")
    .max(2000, "Agirlik cok yuksek"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type WeightInput = z.infer<typeof weightSchema>;
