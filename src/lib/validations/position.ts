import { z } from "zod";

// 2D harita konum guncellemesi (sadece posX/posY).
export const positionSchema = z.object({
  posX: z.coerce.number().finite("Gecerli bir konum giriniz"),
  posY: z.coerce.number().finite("Gecerli bir konum giriniz"),
});

export type PositionInput = z.infer<typeof positionSchema>;
