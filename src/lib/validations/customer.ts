import { z } from "zod";

// Musteri dogrulama semasi. Yalnizca ad zorunlu; iletisim alanlari opsiyonel.
export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ad en az 2 karakter olmalidir")
    .max(80, "Ad en fazla 80 karakter olabilir"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(120)
    .email("Gecerli bir e-posta giriniz")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;
