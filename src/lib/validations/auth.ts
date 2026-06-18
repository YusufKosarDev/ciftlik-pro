import { z } from "zod";

export const userRoles = ["ADMIN", "WORKER", "VET", "ACCOUNTANT"] as const;

// Kullanici olusturma dogrulama semasi.
// Admin, panel icinden yeni personel olustururken kullanir.
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
  role: z.enum(userRoles, { message: "Gecerli bir rol seciniz" }).default("WORKER"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Public "ciftlik olustur" kaydi: yeni bir Tenant + ilk ADMIN (sahip) olusturur.
export const signupSchema = z.object({
  farmName: z
    .string()
    .trim()
    .min(2, "Ciftlik adi en az 2 karakter olmalidir")
    .max(60, "Ciftlik adi en fazla 60 karakter olabilir"),
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

export type SignupInput = z.infer<typeof signupSchema>;

// Davet kabul: davetli kendi adini + parolasini belirler (e-posta davette sabit).
export const acceptInviteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ad en az 2 karakter olmalidir")
    .max(60, "Ad en fazla 60 karakter olabilir"),
  password: z
    .string()
    .min(8, "Parola en az 8 karakter olmalidir")
    .max(72, "Parola en fazla 72 karakter olabilir"),
});

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

// Personel daveti olusturma (ADMIN): e-posta + rol.
export const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Gecerli bir e-posta adresi giriniz"),
  role: z.enum(userRoles, { message: "Gecerli bir rol seciniz" }).default("WORKER"),
});

export type InviteInput = z.infer<typeof inviteSchema>;

// Tenant slug'i: ciftlik adindan URL-guvenli, kisa bir ad uretir.
// Turkce karakterler sadelestirilir; harf/rakam disi her sey "-" olur.
export function slugify(input: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i",
  };
  return input
    .toLowerCase()
    .replace(/[çğıöşüİ]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-") // kalan harf/rakam disi her sey (aksanlilar dahil) "-"
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
