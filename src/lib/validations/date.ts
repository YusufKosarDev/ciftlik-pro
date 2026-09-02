import { z } from "zod";

// Dates arrive from the form as "YYYY-MM-DD" strings. These helpers make sure a
// malformed value ("abc", say) is caught with a 400 during validation, rather than
// reaching the database and producing a 500.

const isValidDate = (value: string) => !Number.isNaN(new Date(value).getTime());

const INVALID_DATE_MESSAGE = "Gecerli bir tarih giriniz";

// A required date field: it cannot be empty and must be a valid date.
export const requiredDateString = (requiredMessage = "Tarih zorunludur") =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine(isValidDate, INVALID_DATE_MESSAGE);

// An optional date field: it may be left empty, but must be valid when filled in.
export const optionalDateString = () =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || isValidDate(v), INVALID_DATE_MESSAGE)
    .optional()
    .or(z.literal(""));
