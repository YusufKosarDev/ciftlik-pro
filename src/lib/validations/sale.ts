import { z } from "zod";
import { requiredDateString } from "@/lib/validations/date";

// The validation schema for a sale. The amount is required and positive; the
// quantity is optional.
export const saleSchema = z.object({
  item: z
    .string()
    .trim()
    .min(1, "Satilan urun/hayvan zorunludur")
    .max(120, "En fazla 120 karakter olabilir"),
  customerId: z.string().trim().optional().or(z.literal("")),
  // An empty string becomes undefined; anything else is coerced to a positive
  // number.
  quantity: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number({ message: "Gecerli bir miktar giriniz" }).positive("Miktar 0'dan buyuk olmalidir").max(1000000000).optional()
  ),
  unit: z.string().trim().max(20).optional().or(z.literal("")),
  amount: z.coerce
    .number({ message: "Gecerli bir tutar giriniz" })
    .positive("Tutar 0'dan buyuk olmalidir")
    .max(100000000, "Tutar cok yuksek"),
  date: requiredDateString(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type SaleInput = z.infer<typeof saleSchema>;
