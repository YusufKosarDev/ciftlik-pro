import { z } from "zod";
import { requiredDateString } from "@/lib/validations/date";

export const transactionTypes = ["INCOME", "EXPENSE"] as const;

// Gelir/gider kaydi dogrulama semasi.
export const transactionSchema = z.object({
  type: z.enum(transactionTypes, { message: "Gecerli bir tur seciniz" }),
  amount: z.coerce
    .number({ message: "Gecerli bir tutar giriniz" })
    .positive("Tutar 0'dan buyuk olmalidir")
    .max(100000000, "Tutar cok yuksek"),
  category: z
    .string()
    .trim()
    .min(1, "Kategori zorunludur")
    .max(80, "Kategori en fazla 80 karakter olabilir"),
  date: requiredDateString(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
