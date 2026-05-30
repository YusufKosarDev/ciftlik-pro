import { z } from "zod";

// Sut verimi dogrulama semasi.
export const milkYieldSchema = z.object({
  date: z.string().trim().min(1, "Tarih zorunludur"),
  amount: z.coerce
    .number({ message: "Gecerli bir miktar giriniz" })
    .positive("Miktar 0'dan buyuk olmalidir")
    .max(1000, "Miktar cok yuksek"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type MilkYieldInput = z.infer<typeof milkYieldSchema>;
