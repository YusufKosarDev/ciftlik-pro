import { z } from "zod";

// Parola degistirme dogrulama semasi.
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut parola zorunludur"),
    newPassword: z
      .string()
      .min(8, "Yeni parola en az 8 karakter olmalidir")
      .max(72, "Parola en fazla 72 karakter olabilir"),
    confirmPassword: z.string().min(1, "Parola tekrari zorunludur"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Parolalar eslesmiyor",
    path: ["confirmPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
