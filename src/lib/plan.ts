import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant-prisma";

// Plan limits (phase 3 — billing). PRO is unlimited.
// FREE: at most 25 ACTIVE animals and 3 users.
export const PLAN_LIMITS: Record<Plan, { animals: number; users: number }> = {
  FREE: { animals: 25, users: 3 },
  PRO: { animals: Infinity, users: Infinity },
};

export type LimitedResource = "animals" | "users";

export const resourceLabels: Record<LimitedResource, string> = {
  animals: "hayvan",
  users: "personel",
};

// The pure check (testable): is the current count below the plan's limit?
export function isWithinLimit(plan: Plan, resource: LimitedResource, current: number): boolean {
  return current < PLAN_LIMITS[plan][resource];
}

// A tenant's current usage of one resource (counted inside the RLS scope).
export async function countResource(tenantId: string, resource: LimitedResource): Promise<number> {
  return withTenant(tenantId, (db) =>
    resource === "animals"
      ? db.animal.count({ where: { status: "ACTIVE" } })
      : db.user.count()
  );
}

// May another record be added? Weighs the plan and the current usage together.
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
