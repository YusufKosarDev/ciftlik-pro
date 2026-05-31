import { z } from "zod";
import { requiredDateString } from "@/lib/validations/date";

// Sut verimi dogrulama semasi.
export const milkYieldSchema = z.object({
  date: requiredDateString(),
  amount: z.coerce
    .number({ message: "Gecerli bir miktar giriniz" })
    .positive("Miktar 0'dan buyuk olmalidir")
    .max(1000, "Miktar cok yuksek"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type MilkYieldInput = z.infer<typeof milkYieldSchema>;
