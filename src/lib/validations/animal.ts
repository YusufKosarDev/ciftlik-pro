import { z } from "zod";

// Prisma enum degerleriyle birebir ayni tutuyoruz.
export const animalSpecies = ["CATTLE", "SHEEP", "GOAT", "CHICKEN", "OTHER"] as const;
export const animalGenders = ["FEMALE", "MALE"] as const;
export const animalStatuses = ["ACTIVE", "SOLD", "DECEASED"] as const;

// Hayvan ekleme/duzenleme dogrulama semasi.
export const animalSchema = z.object({
  tagNumber: z
    .string()
    .trim()
    .min(1, "Kulak numarasi zorunludur")
    .max(40, "Kulak numarasi en fazla 40 karakter olabilir"),
  name: z.string().trim().max(60).optional().or(z.literal("")),
  species: z.enum(animalSpecies, { message: "Gecerli bir tur seciniz" }),
  breed: z.string().trim().max(60).optional().or(z.literal("")),
  gender: z.enum(animalGenders, { message: "Gecerli bir cinsiyet seciniz" }),
  // Form'dan tarih bos veya "YYYY-MM-DD" gelir.
  birthDate: z.string().trim().optional().or(z.literal("")),
  status: z.enum(animalStatuses).default("ACTIVE"),
  imageUrl: z
    .string()
    .trim()
    .url("Gecerli bir URL giriniz")
    .max(500)
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type AnimalInput = z.infer<typeof animalSchema>;
