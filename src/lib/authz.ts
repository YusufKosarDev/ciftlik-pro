import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { navHrefsFor } from "@/lib/nav-permissions";
import { DEMO_EMAILS } from "@/lib/demo-accounts";

// Single source of truth for role-based authorization (RBAC).
// Reading (listing / viewing) is open to any signed-in user; writing (create,
// edit, delete) is restricted by the matrix below. ADMIN can write everywhere.

// Modules that require write permission, and the roles allowed to write in each.
export const writePermissions = {
  animals: ["ADMIN", "WORKER"], // Animal records
  animalMedical: ["ADMIN", "VET"], // Health records and vaccinations
  breeding: ["ADMIN", "VET", "WORKER"], // Breeding / gestation records
  milk: ["ADMIN", "WORKER"], // Milk yield (daily operation)
  weight: ["ADMIN", "WORKER", "VET"], // Weight (weighing) records
  fields: ["ADMIN", "WORKER"], // Fields and crops
  inventory: ["ADMIN", "WORKER"], // Stock / inventory
  transactions: ["ADMIN", "ACCOUNTANT"], // Finance
  sales: ["ADMIN", "ACCOUNTANT"], // Sales (posted to finance as income)
  customers: ["ADMIN", "ACCOUNTANT"], // Customer management
  products: ["ADMIN", "ACCOUNTANT"], // Storefront products
  orders: ["ADMIN", "ACCOUNTANT"], // Order management (status updates)
  tasks: ["ADMIN"], // Task assignment
  users: ["ADMIN"], // Staff management
  structures: ["ADMIN", "WORKER"], // Structures (barn/coop/store) and map position
} satisfies Record<string, Role[]>;

export type WriteModule = keyof typeof writePermissions;

// Does this role have write permission in this module?
export function canWrite(role: Role, module: WriteModule): boolean {
  return (writePermissions[module] as readonly Role[]).includes(role);
}

// Menu / section permissions live in a separate, edge-safe module
// (nav-permissions.ts): the proxy runs in the EDGE runtime and cannot carry this
// file's next-auth / next/navigation imports. They are re-exported here so
// existing callers keep working.
export {
  navByRole,
  navHrefsFor,
  canViewPanelPath,
  panelSectionOf,
} from "@/lib/nav-permissions";
// Note: navHrefsFor is also imported above; `export ... from` is a pure
// re-export and does not create a binding usable inside this module.

// Showcase (read-only) accounts cannot perform any write, so visitors cannot
// damage the live demo. The guard is INDEPENDENT OF ROLE: the WORKER/VET/
// ACCOUNTANT showcase accounts hold their own roles' write permissions, but are
// still refused because their email address is on the list.
//
// The list itself is in src/lib/demo-accounts.ts; that file imports nothing, so
// it can be read both here and by the sign-in screen's client component.
export { DEMO_EMAILS };

export function isDemoUser(email: string | null | undefined): boolean {
  return DEMO_EMAILS.has((email ?? "").toLowerCase());
}

// Used in API routes: verifies the session and checks write permission.
// Returns { session } when allowed, or a ready-made error response ({ error }).
//
//   const authz = await authorizeWrite("animals");
//   if ("error" in authz) return authz.error;
//   // authz.session.user is available
export async function authorizeWrite(module: WriteModule) {
  // These three messages cover all ~35 write endpoints; the language follows the
  // user's choice (cookie) or their browser preference.
  const [session, te] = await Promise.all([auth(), getTranslations("Errors")]);
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: te("unauthorized") }, { status: 401 }),
    } as const;
  }
  // Demo accounts are read-only.
  if (isDemoUser(session.user.email)) {
    return {
      error: NextResponse.json({ error: te("demoReadOnly") }, { status: 403 }),
    } as const;
  }
  if (!canWrite(session.user.role, module)) {
    return {
      error: NextResponse.json({ error: te("forbidden") }, { status: 403 }),
    } as const;
  }
  return { session } as const;
}

// Used on server pages (create / edit forms): redirects to the dashboard when the
// user has no write permission. Returns the session when they do.
export async function requirePageWrite(module: WriteModule) {
  const session = await auth();
  if (
    !session?.user ||
    isDemoUser(session.user.email) ||
    !canWrite(session.user.role, module)
  ) {
    redirect("/panel");
  }
  return session;
}

// Used on sensitive read pages (e.g. finance): stops a user from opening a path
// that is not in their role's menu by typing the URL. Returns the session if the
// path is in the menu (i.e. defined in navByRole), otherwise redirects to the
// dashboard.
export async function requirePageView(href: string) {
  const session = await auth();
  if (!session?.user) {
    redirect("/giris");
  }
  if (!navHrefsFor(session.user.role).has(href)) {
    redirect("/panel");
  }
  return session;
}
