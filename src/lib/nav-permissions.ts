import type { Role } from "@prisma/client";

// Role -> the panel sections it can see. EDGE-SAFE: this file imports types only;
// it pulls in NO next-auth, next/navigation or Prisma runtime. That is what lets
// the proxy (edge) and the server components share one source.
//
// authz.ts re-exports these, so existing callers are unaffected.
export const navByRole: Record<Role, string[]> = {
  ADMIN: [
    "/panel",
    "/panel/harita",
    "/panel/takvim",
    "/panel/hayvanlar",
    "/panel/tarlalar",
    "/panel/stok",
    "/panel/yem",
    "/panel/yapilar",
    "/panel/finans",
    "/panel/satis",
    "/panel/musteriler",
    "/panel/urunler",
    "/panel/siparisler",
    "/panel/gorevler",
    "/panel/personel",
    "/panel/denetim",
  ],
  WORKER: [
    "/panel",
    "/panel/harita",
    "/panel/takvim",
    "/panel/hayvanlar",
    "/panel/tarlalar",
    "/panel/stok",
    "/panel/yem",
    "/panel/yapilar",
    "/panel/gorevler",
  ],
  VET: ["/panel", "/panel/harita", "/panel/takvim", "/panel/hayvanlar", "/panel/gorevler"],
  ACCOUNTANT: [
    "/panel",
    "/panel/harita",
    "/panel/takvim",
    "/panel/finans",
    "/panel/satis",
    "/panel/musteriler",
    "/panel/urunler",
    "/panel/siparisler",
    "/panel/gorevler",
  ],
};

// The set of paths a role can see in its menu.
export function navHrefsFor(role: Role): Set<string> {
  return new Set(navByRole[role]);
}

// Panel paths open to every user, NOT subject to the section restriction.
// (The profile is personal; the billing page does its own ADMIN check.)
const ALWAYS_ALLOWED = new Set(["/panel/profil", "/panel/abonelik"]);

/**
 * Finds a panel path's parent section: "/panel/finans/12/duzenle" -> "/panel/finans".
 * Returns "/panel" for both "/panel" and "/panel/".
 */
export function panelSectionOf(pathname: string): string {
  const rest = pathname.slice("/panel".length).replace(/^\/+/, "");
  if (!rest) return "/panel";
  const first = rest.split("/")[0];
  return `/panel/${first}`;
}

/**
 * May this role open this panel path?
 *
 * It works per section: if a role cannot see "/panel/finans", then
 * "/panel/finans/yeni" and "/panel/finans/<id>/duzenle" are closed too.
 * A section we do not recognise — a new page that is not in any menu — is NOT
 * blocked. Authorization is enforced again on the server, and failing open here
 * is better than making a new page silently unreachable.
 */
export function canViewPanelPath(role: Role, pathname: string): boolean {
  if (ALWAYS_ALLOWED.has(pathname)) return true;
  const section = panelSectionOf(pathname);
  const allowed = navHrefsFor(role);
  if (allowed.has(section)) return true;
  // If the section is in no role's menu it is an unknown or new page: let it pass.
  const knownSections = new Set(Object.values(navByRole).flat());
  return !knownSections.has(section);
}
