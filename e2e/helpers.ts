import { expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/**
 * Giris hiz siniri sayacini sifirlar. HER SPEC DOSYASININ BASINDA cagrilir:
 *
 *   test.beforeAll(resetLoginRateLimit);
 *
 * NEDEN GEREKLI: src/lib/auth.ts, 15 dakikalik pencerede tek IP'den en fazla
 * MAX_PER_IP (30) giris denemesine izin verir. Sayac Postgres'te tutuldugundan
 * (bellek-ici degil — bkz. src/lib/rate-limit.ts) hem testler hem KOSUMLAR
 * ARASINDA yasar. Suite tek IP'den (::1) ~32 giris yapiyor; yani sinir asiliyor
 * ve siradaki giris "hatali parola" gibi gorunerek sessizce basarisiz oluyor.
 *
 * NEDEN globalSetup DEGIL: globalSetup koşum basina BIR KEZ calisir; suite tek
 * kosumda zaten siniri asiyor, dolayisiyla bastaki tek temizlik yetmez.
 * Dosya basina temizlik hem koşum-ici hem koşumlar-arasi izolasyon saglar.
 *
 * NEDEN URETIM AYARI DEGISTIRILMIYOR: MAX_PER_IP bir guvenlik kontrolu
 * (brute-force / credential stuffing). Test butcesi icin gevsetmek yanlis
 * sebeple dogru ayari bozmak olurdu.
 *
 * YALNIZCA "login:" anahtarlari silinir; siparis (`order:`) ve davet kabulu
 * (`accept:`) sayaclari dokunulmadan kalir, boylece o uclarin kendi hiz
 * sinirlari e2e'de hala gercek davranisiyla calisir.
 */
export async function resetLoginRateLimit(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.rateLimit.deleteMany({ where: { key: { startsWith: "login:" } } });
  } finally {
    await prisma.$disconnect();
  }
}

// Seed verisindeki hesaplar (prisma/seed.ts). Parola hepsinde ayni.
export const ACCOUNTS = {
  admin: { email: "admin@ciftlik.com", password: "sifre1234" },
  worker: { email: "ahmet@ciftlik.com", password: "sifre1234" },
  vet: { email: "vet@ciftlik.com", password: "sifre1234" },
};

// Giris formu uzerinden oturum acar ve panele ulasildigini dogrular.
export async function login(
  page: Page,
  account: { email: string; password: string }
) {
  await page.goto("/giris");
  await page.getByLabel("E-posta").fill(account.email);
  await page.getByLabel("Parola").fill(account.password);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page).toHaveURL(/\/panel$/);
}
