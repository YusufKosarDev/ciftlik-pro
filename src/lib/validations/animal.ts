import { z } from "zod";
import { optionalDateString } from "@/lib/validations/date";

// Kept exactly in step with the Prisma enum values.
export const animalSpecies = ["CATTLE", "SHEEP", "GOAT", "CHICKEN", "OTHER"] as const;
export const animalGenders = ["FEMALE", "MALE"] as const;
export const animalStatuses = ["ACTIVE", "SOLD", "DECEASED"] as const;

// The validation schema for creating and editing an animal.
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
  // From the form the date arrives either empty or as "YYYY-MM-DD".
  birthDate: optionalDateString(),
  status: z.enum(animalStatuses).default("ACTIVE"),
  // The image may only be an http(s) URL. On its own ".url()" also accepts schemes
  // like javascript:, data: and file:, so the scheme is restricted to http/https
  // explicitly (which matches the CSP's img-src).
  imageUrl: z
    .string()
    .trim()
    .url("Gecerli bir URL giriniz")
    .max(500)
    .refine((u) => /^https?:\/\//i.test(u), "URL http:// veya https:// ile baslamalidir")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  // Lineage: the mother animal's id (optional). The check against choosing itself
  // as its own mother lives in the API.
  motherId: z.string().trim().optional().or(z.literal("")),
});

export type AnimalInput = z.infer<typeof animalSchema>;
