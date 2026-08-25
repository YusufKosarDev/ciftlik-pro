import type { Role } from "@prisma/client";

// Rol -> gorebilecegi panel bolumleri. EDGE-GUVENLI: bu dosya yalnizca tip
// import eder; next-auth, next/navigation veya Prisma runtime'i CEKMEZ. Boylece
// hem proxy (edge) hem sunucu bilesenleri ayni kaynagi kullanabilir.
//
// authz.ts bunlari yeniden export eder; mevcut cagiranlar degismez.
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

// Bir rolun menude gorebilecegi yollarin kumesi.
export function navHrefsFor(role: Role): Set<string> {
  return new Set(navByRole[role]);
}

// Her kullaniciya acik olan, bolum kisitina tabi OLMAYAN panel yollari.
// (Profil kisiseldir; abonelik sayfasi kendi icinde ADMIN kontrolu yapar.)
const ALWAYS_ALLOWED = new Set(["/panel/profil", "/panel/abonelik"]);

/**
 * Bir panel yolunun ust bolumunu bulur: "/panel/finans/12/duzenle" -> "/panel/finans".
 * "/panel" ve "/panel/" icin "/panel" doner.
 */
export function panelSectionOf(pathname: string): string {
  const rest = pathname.slice("/panel".length).replace(/^\/+/, "");
  if (!rest) return "/panel";
  const first = rest.split("/")[0];
  return `/panel/${first}`;
}

/**
 * Rol bu panel yolunu acabilir mi?
 *
 * Bolum bazinda calisir: bir rol "/panel/finans"i goremiyorsa
 * "/panel/finans/yeni" ve "/panel/finans/<id>/duzenle" de kapalidir.
 * Tanimadigimiz bir bolum (menude olmayan yeni bir sayfa) ENGELLENMEZ —
 * yetkilendirme sunucu tarafinda ayrica uygulanir ve burada fail-open olmak,
 * yeni bir sayfayi sessizce erisilemez kilmaktan iyidir.
 */
export function canViewPanelPath(role: Role, pathname: string): boolean {
  if (ALWAYS_ALLOWED.has(pathname)) return true;
  const section = panelSectionOf(pathname);
  const allowed = navHrefsFor(role);
  if (allowed.has(section)) return true;
  // Bolum hicbir rolun menusunde yoksa bilinmeyen/yeni bir sayfadir: gecir.
  const knownSections = new Set(Object.values(navByRole).flat());
  return !knownSections.has(section);
}
