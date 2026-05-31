import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";

// Rol bazli yetkilendirme (RBAC) icin tek merkez.
// Okuma (listeleme/goruntuleme) giris yapmis her kullaniciya aciktir;
// yazma (ekle/duzenle/sil) islemleri ise asagidaki matrise gore kisitlanir.
// ADMIN her modulde tam yetkilidir.

// Yazma yetkisi gerektiren moduller ve bu modulde yazabilen roller.
export const writePermissions = {
  animals: ["ADMIN", "WORKER"], // Hayvan kaydi
  animalMedical: ["ADMIN", "VET"], // Saglik kaydi ve asi
  milk: ["ADMIN", "WORKER"], // Sut verimi (gunluk islem)
  fields: ["ADMIN", "WORKER"], // Tarla ve ekim
  inventory: ["ADMIN", "WORKER"], // Stok / envanter
  transactions: ["ADMIN", "ACCOUNTANT"], // Finans
  tasks: ["ADMIN"], // Gorev atama
  users: ["ADMIN"], // Personel yonetimi
} satisfies Record<string, Role[]>;

export type WriteModule = keyof typeof writePermissions;

// Bir rolun belirli bir modulde yazma yetkisi var mi?
export function canWrite(role: Role, module: WriteModule): boolean {
  return (writePermissions[module] as readonly Role[]).includes(role);
}

// Hangi rol ust menude hangi panel yollarini gorur.
// (Okuma acik olsa da menu role gore sadelestirilir.)
const navByRole: Record<Role, string[]> = {
  ADMIN: [
    "/panel",
    "/panel/harita",
    "/panel/hayvanlar",
    "/panel/tarlalar",
    "/panel/stok",
    "/panel/finans",
    "/panel/gorevler",
    "/panel/personel",
  ],
  WORKER: [
    "/panel",
    "/panel/harita",
    "/panel/hayvanlar",
    "/panel/tarlalar",
    "/panel/stok",
    "/panel/gorevler",
  ],
  VET: ["/panel", "/panel/harita", "/panel/hayvanlar", "/panel/gorevler"],
  ACCOUNTANT: ["/panel", "/panel/harita", "/panel/finans", "/panel/gorevler"],
};

// Bir rolun menude gorebilecegi yollarin kumesi.
export function navHrefsFor(role: Role): Set<string> {
  return new Set(navByRole[role]);
}

// API rotalarinda kullanilir: oturumu dogrular ve yazma yetkisini kontrol eder.
// Yetki varsa { session } doner; yoksa hazir bir hata yaniti ({ error }) doner.
//
//   const authz = await authorizeWrite("animals");
//   if ("error" in authz) return authz.error;
//   // authz.session.user kullanilabilir
export async function authorizeWrite(module: WriteModule) {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Yetkisiz" }, { status: 401 }),
    } as const;
  }
  if (!canWrite(session.user.role, module)) {
    return {
      error: NextResponse.json(
        { error: "Bu islem icin yetkiniz yok" },
        { status: 403 }
      ),
    } as const;
  }
  return { session } as const;
}

// Sunucu sayfalarinda (ekle/duzenle formlari) kullanilir: yazma yetkisi
// yoksa kullaniciyi panele yonlendirir. Yetki varsa oturumu doner.
export async function requirePageWrite(module: WriteModule) {
  const session = await auth();
  if (!session?.user || !canWrite(session.user.role, module)) {
    redirect("/panel");
  }
  return session;
}
