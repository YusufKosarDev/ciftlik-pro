import { z } from "zod";

export const inventoryCategories = ["FEED", "MEDICINE", "EQUIPMENT", "OTHER"] as const;

// Stok kalemi dogrulama semasi.
export const inventorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Kalem adi zorunludur")
    .max(80, "Kalem adi en fazla 80 karakter olabilir"),
  category: z.enum(inventoryCategories, { message: "Gecerli bir kategori seciniz" }),
  quantity: z.coerce
    .number({ message: "Gecerli bir miktar giriniz" })
    .min(0, "Miktar negatif olamaz")
    .max(1000000, "Miktar cok yuksek"),
  unit: z
    .string()
    .trim()
    .min(1, "Birim zorunludur")
    .max(20, "Birim en fazla 20 karakter olabilir"),
  criticalLevel: z.coerce
    .number({ message: "Gecerli bir kritik seviye giriniz" })
    .min(0, "Kritik seviye negatif olamaz")
    .max(1000000)
    .default(0),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type InventoryInput = z.infer<typeof inventorySchema>;
