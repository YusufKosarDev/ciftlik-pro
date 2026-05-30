import { z } from "zod";

// Tarla dogrulama semasi.
export const fieldSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tarla adi zorunludur")
    .max(80, "Tarla adi en fazla 80 karakter olabilir"),
  area: z.coerce
    .number({ message: "Gecerli bir alan giriniz" })
    .positive("Alan 0'dan buyuk olmalidir")
    .max(100000, "Alan cok yuksek"),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type FieldInput = z.infer<typeof fieldSchema>;
