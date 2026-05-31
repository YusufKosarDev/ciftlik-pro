import { z } from "zod";
import { requiredDateString, optionalDateString } from "@/lib/validations/date";

export const cropStatuses = ["PLANTED", "GROWING", "HARVESTED"] as const;

// Ekim kaydi dogrulama semasi.
export const cropSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Urun adi zorunludur")
    .max(80, "Urun adi en fazla 80 karakter olabilir"),
  plantedDate: requiredDateString("Ekim tarihi zorunludur"),
  harvestDate: optionalDateString(),
  status: z.enum(cropStatuses).default("PLANTED"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CropInput = z.infer<typeof cropSchema>;
