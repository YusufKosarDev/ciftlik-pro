import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant-prisma";

// Plan limitleri (Faz 3 — faturalandırma). PRO sınırsızdır.
// FREE: en fazla 25 AKTIF hayvan ve 3 kullanıcı.
export const PLAN_LIMITS: Record<Plan, { animals: number; users: number }> = {
  FREE: { animals: 25, users: 3 },
  PRO: { animals: Infinity, users: Infinity },
};

export type LimitedResource = "animals" | "users";

export const resourceLabels: Record<LimitedResource, string> = {
  animals: "hayvan",
  users: "personel",
};

// Saf kontrol (test edilebilir): mevcut sayı, plan limitinin altında mı?
export function isWithinLimit(plan: Plan, resource: LimitedResource, current: number): boolean {
  return current < PLAN_LIMITS[plan][resource];
}

// Bir tenant'ın belirli kaynaktaki mevcut kullanımı (RLS kapsamında sayılır).
export async function countResource(tenantId: string, resource: LimitedResource): Promise<number> {
  return withTenant(tenantId, (db) =>
    resource === "animals"
      ? db.animal.count({ where: { status: "ACTIVE" } })
      : db.user.count()
  );
}

// Yeni bir kayıt eklenebilir mi? Plan + mevcut kullanımı birlikte değerlendirir.
export async function canAddRecord(
  tenantId: string,
  resource: LimitedResource
): Promise<{ allowed: boolean; plan: Plan; limit: number; current: number }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });
  const plan: Plan = tenant?.plan ?? "FREE";
  const limit = PLAN_LIMITS[plan][resource];
  if (limit === Infinity) {
    return { allowed: true, plan, limit, current: 0 };
  }
  const current = await countResource(tenantId, resource);
  return { allowed: current < limit, plan, limit, current };
}
