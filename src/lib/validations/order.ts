import { z } from "zod";

// Magaza siparisi (cok kalemli, odemesiz olabilir) dogrulama semasi. Herkese acik
// uctan gelir; hem istemci hem sunucuda dogrulanir.
export const orderItemSchema = z.object({
  productId: z.string().trim().min(1, "Urun secimi gecersiz"),
  quantity: z.coerce
    .number({ message: "Gecerli bir miktar giriniz" })
    .positive("Miktar 0'dan buyuk olmalidir")
    .max(100000, "Miktar cok yuksek"),
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Sepet bos"),
  customerName: z
    .string()
    .trim()
    .min(2, "Ad en az 2 karakter olmalidir")
    .max(80, "En fazla 80 karakter olabilir"),
  customerPhone: z.string().trim().max(30).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type OrderInput = z.infer<typeof orderSchema>;
