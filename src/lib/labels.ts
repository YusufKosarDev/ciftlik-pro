import type {
  AnimalSpecies,
  AnimalGender,
  AnimalStatus,
  CropStatus,
  InventoryCategory,
  TransactionType,
  TaskStatus,
  StructureType,
  BreedingStatus,
  Role,
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

export const taskStatusLabels: Record<TaskStatus, string> = {
  PENDING: "Bekliyor",
  IN_PROGRESS: "Devam ediyor",
  DONE: "Tamamlandi",
};

export const breedingStatusLabels: Record<BreedingStatus, string> = {
  PLANNED: "Planlandi",
  PREGNANT: "Gebe",
  BORN: "Dogdu",
  FAILED: "Basarisiz",
};

export const structureTypeLabels: Record<StructureType, string> = {
  BARN: "Ahir",
  COOP: "Kumes",
  STORAGE: "Depo",
  OTHER: "Diger",
};

export const roleLabels: Record<Role, string> = {
  ADMIN: "Yonetici",
  WORKER: "Calisan",
  VET: "Veteriner",
  ACCOUNTANT: "Muhasebeci",
};
