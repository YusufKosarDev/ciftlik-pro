import { getTranslations } from "next-intl/server";
import type {
  AnimalSpecies,
  AnimalGender,
  AnimalStatus,
  CropStatus,
  InventoryCategory,
  TransactionType,
  TaskStatus,
  StructureType,
  AuditAction,
  OrderStatus,
  PaymentStatus,
  Role,
} from "@prisma/client";

// Enum etiketleri icin i18n yardimcisi (sunucu bilesenleri). `useLabels` (client)
// ile ayni sekli dondurur; cagri yerleri `const { speciesLabels } = await getLabels();`.
export async function getLabels() {
  // Dinamik (enum'dan turetilmis) anahtarlar icin gevsek imza; degerler katalogda mevcut.
  const t = (await getTranslations("Labels")) as unknown as (key: string) => string;
  const map = <T extends string>(group: string, keys: readonly T[]) =>
    Object.fromEntries(keys.map((k) => [k, t(`${group}.${k}`)])) as Record<T, string>;

  return {
    speciesLabels: map<AnimalSpecies>("species", ["CATTLE", "SHEEP", "GOAT", "CHICKEN", "OTHER"]),
    genderLabels: map<AnimalGender>("gender", ["FEMALE", "MALE"]),
    statusLabels: map<AnimalStatus>("animalStatus", ["ACTIVE", "SOLD", "DECEASED"]),
    cropStatusLabels: map<CropStatus>("cropStatus", ["PLANTED", "GROWING", "HARVESTED"]),
    inventoryCategoryLabels: map<InventoryCategory>("inventoryCategory", [
      "FEED",
      "MEDICINE",
      "EQUIPMENT",
      "OTHER",
    ]),
    transactionTypeLabels: map<TransactionType>("transactionType", ["INCOME", "EXPENSE"]),
    taskStatusLabels: map<TaskStatus>("taskStatus", ["PENDING", "IN_PROGRESS", "DONE"]),
    breedingStatusLabels: map("breedingStatus", ["PLANNED", "PREGNANT", "BORN", "FAILED"] as const),
    structureTypeLabels: map<StructureType>("structureType", ["BARN", "COOP", "STORAGE", "OTHER"]),
    auditActionLabels: map<AuditAction>("auditAction", ["CREATE", "UPDATE", "DELETE", "LOGIN_FAILED"]),
    roleLabels: map<Role>("role", ["ADMIN", "WORKER", "VET", "ACCOUNTANT"]),
    orderStatusLabels: map<OrderStatus>("orderStatus", ["PENDING", "CONFIRMED", "CANCELLED"]),
    paymentStatusLabels: map<PaymentStatus>("paymentStatus", ["UNPAID", "PAID"]),
  };
}
