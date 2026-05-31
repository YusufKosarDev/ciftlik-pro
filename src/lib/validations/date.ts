import { z } from "zod";

// Form'dan tarih "YYYY-MM-DD" string'i olarak gelir. Bu yardimcilar,
// bozuk bir tarih degeri (orn. "abc") veritabanina ulasip 500 hatasi
// uretmeden once, dogrulama asamasinda 400 ile yakalanmasini saglar.

const isValidDate = (value: string) => !Number.isNaN(new Date(value).getTime());

const INVALID_DATE_MESSAGE = "Gecerli bir tarih giriniz";

// Zorunlu tarih alani: bos olamaz ve gecerli bir tarih olmalidir.
export const requiredDateString = (requiredMessage = "Tarih zorunludur") =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine(isValidDate, INVALID_DATE_MESSAGE);

// Istege bagli tarih alani: bos birakilabilir, ama doluysa gecerli olmalidir.
export const optionalDateString = () =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || isValidDate(v), INVALID_DATE_MESSAGE)
    .optional()
    .or(z.literal(""));
