import { z } from "zod";
import { requiredDateString } from "@/lib/validations/date";

// Yem tuketim kaydi dogrulama semasi.
export const feedSchema = z.object({
  inventoryItemId: z.string().trim().min(1, "Yem kalemi seciniz"),
  date: requiredDateString(),
  quantity: z.coerce
    .number({ message: "Gecerli bir miktar giriniz" })
    .positive("Miktar 0'dan buyuk olmalidir")
    .max(100000, "Miktar cok yuksek"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type FeedInput = z.infer<typeof feedSchema>;
