import type {
  AnimalSpecies,
  AnimalGender,
  AnimalStatus,
  CropStatus,
  InventoryCategory,
  TransactionType,
} from "@prisma/client";

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

export const cropStatusLabels: Record<CropStatus, string> = {
  PLANTED: "Ekildi",
  GROWING: "Buyuyor",
  HARVESTED: "Hasat edildi",
};

export const inventoryCategoryLabels: Record<InventoryCategory, string> = {
  FEED: "Yem",
  MEDICINE: "Ilac",
  EQUIPMENT: "Ekipman",
  OTHER: "Diger",
};

export const transactionTypeLabels: Record<TransactionType, string> = {
  INCOME: "Gelir",
  EXPENSE: "Gider",
};
