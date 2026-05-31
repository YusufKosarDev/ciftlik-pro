import { z } from "zod";

export const structureTypes = ["BARN", "COOP", "STORAGE", "OTHER"] as const;

// Yapi (ahir/kumes/depo) dogrulama semasi.
// Konum (posX/posY/width/height) form'dan degil, haritadan yonetilir.
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
