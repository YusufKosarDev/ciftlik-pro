import { expect, type Page } from "@playwright/test";

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
