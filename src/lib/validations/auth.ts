import { z } from "zod";

// Kayit formu icin dogrulama semasi.
// Hem API tarafinda hem de ileride form tarafinda ayni semayi kullanacagiz.
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ad en az 2 karakter olmalidir")
    .max(60, "Ad en fazla 60 karakter olabilir"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Gecerli bir e-posta adresi giriniz"),
  password: z
    .string()
    .min(8, "Parola en az 8 karakter olmalidir")
    .max(72, "Parola en fazla 72 karakter olabilir"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
