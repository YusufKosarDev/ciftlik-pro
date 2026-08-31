import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { navHrefsFor } from "@/lib/nav-permissions";
import { DEMO_EMAILS } from "@/lib/demo-accounts";

// Rol bazli yetkilendirme (RBAC) icin tek merkez.
// Okuma (listeleme/goruntuleme) giris yapmis her kullaniciya aciktir;
// yazma (ekle/duzenle/sil) islemleri ise asagidaki matrise gore kisitlanir.
// ADMIN her modulde tam yetkilidir.

// Yazma yetkisi gerektiren moduller ve bu modulde yazabilen roller.
export const writePermissions = {
  animals: ["ADMIN", "WORKER"], // Hayvan kaydi
  animalMedical: ["ADMIN", "VET"], // Saglik kaydi ve asi
  breeding: ["ADMIN", "VET", "WORKER"], // Ureme/gebelik kayitlari
  milk: ["ADMIN", "WORKER"], // Sut verimi (gunluk islem)
  weight: ["ADMIN", "WORKER", "VET"], // Agirlik (tartim) kayitlari
  fields: ["ADMIN", "WORKER"], // Tarla ve ekim
  inventory: ["ADMIN", "WORKER"], // Stok / envanter
  transactions: ["ADMIN", "ACCOUNTANT"], // Finans
  sales: ["ADMIN", "ACCOUNTANT"], // Satis (gelir olarak finansa yansir)
  customers: ["ADMIN", "ACCOUNTANT"], // Musteri yonetimi
  products: ["ADMIN", "ACCOUNTANT"], // Magaza urunleri
  orders: ["ADMIN", "ACCOUNTANT"], // Siparis yonetimi (durum guncelleme)
  tasks: ["ADMIN"], // Gorev atama
  users: ["ADMIN"], // Personel yonetimi
  structures: ["ADMIN", "WORKER"], // Yapilar (ahir/kumes/depo) ve harita konumu
} satisfies Record<string, Role[]>;

export type WriteModule = keyof typeof writePermissions;

// Bir rolun belirli bir modulde yazma yetkisi var mi?
export function canWrite(role: Role, module: WriteModule): boolean {
  return (writePermissions[module] as readonly Role[]).includes(role);
}

// Menu/bolum izinleri edge-guvenli ayri bir modulde tutulur (nav-permissions.ts):
// proxy EDGE ortaminda calisir; bu dosyanin next-auth / next/navigation
// importlarini oraya tasiyamayiz. Mevcut cagiranlar bozulmasin diye buradan
// yeniden export ediliyor.
export {
  navByRole,
  navHrefsFor,
  canViewPanelPath,
  panelSectionOf,
} from "@/lib/nav-permissions";
// Not: navHrefsFor ayrica yukarida import edilir; `export ... from` saf bir
// yeniden-export'tur ve bu modul icinde kullanilabilir bir bagalanti olusturmaz.

// Demo (salt-okunur) hesaplar hicbir yazma islemi yapamaz; boylece canli
// demoda ziyaretciler veriyi bozamaz. Koruma ROLDEN BAGIMSIZDIR: vitrindeki
// WORKER/VET/ACCOUNTANT hesaplari kendi rollerinin yazma yetkisine sahip olsa
// da e-postalari listede oldugu icin reddedilir.
//
// Liste src/lib/demo-accounts.ts'te; o dosya hicbir sey import etmez, bu yuzden
// hem burada hem giris ekraninin istemci bileseninde okunabilir.
export { DEMO_EMAILS };

export function isDemoUser(email: string | null | undefined): boolean {
  return DEMO_EMAILS.has((email ?? "").toLowerCase());
}

// API rotalarinda kullanilir: oturumu dogrular ve yazma yetkisini kontrol eder.
// Yetki varsa { session } doner; yoksa hazir bir hata yaniti ({ error }) doner.
//
//   const authz = await authorizeWrite("animals");
//   if ("error" in authz) return authz.error;
//   // authz.session.user kullanilabilir
export async function authorizeWrite(module: WriteModule) {
  // Bu uc mesaj ~35 yazma ucunun tamamini kapsar; dil kullanicinin secimine
  // (cookie) ya da tarayici tercihine gore gelir.
  const [session, te] = await Promise.all([auth(), getTranslations("Errors")]);
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: te("unauthorized") }, { status: 401 }),
    } as const;
  }
  // Demo hesabi salt-okunurdur.
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

// Sunucu sayfalarinda (ekle/duzenle formlari) kullanilir: yazma yetkisi
// yoksa kullaniciyi panele yonlendirir. Yetki varsa oturumu doner.
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

// Hassas okuma sayfalarinda (orn. finans) kullanilir: rolun menusunde
// gorunmeyen bir yolu dogrudan URL ile acmasini engeller. Menude varsa
// (yani navByRole'de tanimliysa) oturumu doner, yoksa panele yonlendirir.
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
