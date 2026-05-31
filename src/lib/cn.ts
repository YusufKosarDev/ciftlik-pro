import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind sinif birlestirme: kosullu siniflar + cakisma cozumu.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
