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

// The i18n helper for enum labels, for server components. It returns the same
// shape as `useLabels` (client); call sites read
// `const { speciesLabels } = await getLabels();`.
export async function getLabels() {
  // A loose signature for the dynamic (enum-derived) keys; the values exist in the
  // catalogue.
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
