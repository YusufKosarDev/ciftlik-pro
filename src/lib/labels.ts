import type { AnimalSpecies, AnimalGender, AnimalStatus } from "@prisma/client";

// Enum degerlerini arayuzde gosterecegimiz Turkce etiketlere ceviren haritalar.

export const speciesLabels: Record<AnimalSpecies, string> = {
  CATTLE: "Sigir",
  SHEEP: "Koyun",
  GOAT: "Keci",
  CHICKEN: "Tavuk",
  OTHER: "Diger",
};

export const genderLabels: Record<AnimalGender, string> = {
  FEMALE: "Disi",
  MALE: "Erkek",
};

export const statusLabels: Record<AnimalStatus, string> = {
  ACTIVE: "Aktif",
  SOLD: "Satildi",
  DECEASED: "Oldu",
};
