import { z } from "zod";

export const userRoles = ["ADMIN", "WORKER", "VET", "ACCOUNTANT"] as const;

// The validation schema for creating a user.
// Used when an admin creates a new staff member from inside the panel.
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

// The public "create a farm" sign-up: creates a new Tenant plus the first ADMIN
// (the owner).
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

// Invitation acceptance: the invitee sets their own name and password (the email
// is fixed by the invitation).
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

// Creating a staff invitation (ADMIN): an email address and a role.
export const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Gecerli bir e-posta adresi giriniz"),
  role: z.enum(userRoles, { message: "Gecerli bir rol seciniz" }).default("WORKER"),
});

export type InviteInput = z.infer<typeof inviteSchema>;

// The tenant slug: derives a short, URL-safe name from the farm's name.
// Non-ASCII letters are folded down, and anything that is not a letter or a digit
// becomes "-".
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
