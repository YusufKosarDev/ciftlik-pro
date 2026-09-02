import { z } from "zod";

export const structureTypes = ["BARN", "COOP", "STORAGE", "OTHER"] as const;

// The validation schema for a structure (barn/coop/store).
// The position (posX/posY/width/height) is managed from the map, not from this
// form.
export const structureSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Yapi adi zorunludur")
    .max(80, "Ad en fazla 80 karakter olabilir"),
  type: z.enum(structureTypes, { message: "Gecerli bir tur seciniz" }),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type StructureInput = z.infer<typeof structureSchema>;
