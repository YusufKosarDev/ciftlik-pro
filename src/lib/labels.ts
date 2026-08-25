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
  AuditAction,
  OrderStatus,
  Role,
} from "@prisma/client";

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandı",
  CANCELLED: "İptal",
};

// Enum degerlerini arayuzde gosterecegimiz Turkce etiketlere ceviren haritalar.
// (i18n disi/yedek yol; cevrilmis surumler icin src/lib/get-labels.ts ve use-labels.ts.)

export const speciesLabels: Record<AnimalSpecies, string> = {
  CATTLE: "Sığır",
  SHEEP: "Koyun",
  GOAT: "Keçi",
  CHICKEN: "Tavuk",
  OTHER: "Diğer",
};

export const genderLabels: Record<AnimalGender, string> = {
  FEMALE: "Dişi",
  MALE: "Erkek",
};

export const statusLabels: Record<AnimalStatus, string> = {
  ACTIVE: "Aktif",
  SOLD: "Satıldı",
  DECEASED: "Öldü",
};

export const cropStatusLabels: Record<CropStatus, string> = {
  PLANTED: "Ekildi",
  GROWING: "Büyüyor",
  HARVESTED: "Hasat edildi",
};

export const inventoryCategoryLabels: Record<InventoryCategory, string> = {
  FEED: "Yem",
  MEDICINE: "İlaç",
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
  DONE: "Tamamlandı",
};

export const breedingStatusLabels: Record<BreedingStatus, string> = {
  PLANNED: "Planlandı",
  PREGNANT: "Gebe",
  BORN: "Doğdu",
  FAILED: "Başarısız",
};

export const structureTypeLabels: Record<StructureType, string> = {
  BARN: "Ahır",
  COOP: "Kümes",
  STORAGE: "Depo",
  OTHER: "Diger",
};

export const auditActionLabels: Record<AuditAction, string> = {
  CREATE: "Oluşturma",
  UPDATE: "Güncelleme",
  DELETE: "Silme",
  LOGIN_FAILED: "Başarısız giriş",
};

export const roleLabels: Record<Role, string> = {
  ADMIN: "Yönetici",
  WORKER: "Çalışan",
  VET: "Veteriner",
  ACCOUNTANT: "Muhasebeci",
};
