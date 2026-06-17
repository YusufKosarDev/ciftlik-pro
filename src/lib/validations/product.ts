import { z } from "zod";

// Magaza urunu dogrulama semasi.
export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Urun adi en az 2 karakter olmalidir")
    .max(120, "En fazla 120 karakter olabilir"),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  price: z.coerce
    .number({ message: "Gecerli bir fiyat giriniz" })
    .positive("Fiyat 0'dan buyuk olmalidir")
    .max(100000000, "Fiyat cok yuksek"),
  unit: z.string().trim().max(20).optional().or(z.literal("")),
  // Checkbox: "on"/"true"/true -> aktif; aksi -> pasif.
  active: z.preprocess(
    (v) => v === true || v === "true" || v === "on",
    z.boolean()
  ),
});

export type ProductInput = z.infer<typeof productSchema>;
