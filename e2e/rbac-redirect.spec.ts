import { test, expect } from "@playwright/test";
import { login, ACCOUNTS } from "./helpers";

// Rol bazli bolum kontrolu artik EDGE'de (proxy) yapiliyor ve GERCEK bir HTTP
// yonlendirmesi donuyor. Onceden sunucu bileseninde redirect() cagriliyordu;
// layout stream'lendikten sonra calistigi icin yanit 200 + istemci tarafi
// yonlendirme oluyordu (veri sizmiyordu ama durum kodundan ayirt edilemiyordu).

test("WORKER yetkisiz bolumden GERCEK http yonlendirmesiyle donderilir", async ({ page }) => {
  await login(page, ACCOUNTS.worker);

  const response = await page.goto("/panel/finans");

  // Zincirdeki ilk yanit bir yonlendirme olmali (200 + istemci yonlendirmesi degil).
  const chain = response?.request().redirectedFrom();
  expect(chain, "yanit bir yonlendirme zincirinin sonucu olmali").not.toBeNull();

  await expect(page).toHaveURL(/\/panel$/);
});

test("yetkisiz bolumun ALT rotalari da engellenir", async ({ page }) => {
  await login(page, ACCOUNTS.worker);

  // Bolum kontrolu prefix bazlidir: /panel/finans kapaliysa alt rotalari da kapali.
  for (const path of ["/panel/finans/yeni", "/panel/personel", "/panel/denetim"]) {
    await page.goto(path);
    await expect(page, `${path} panele yonlendirmeli`).toHaveURL(/\/panel$/);
  }
});

test("VET kendi bolumlerini gorur, digerlerini goremez", async ({ page }) => {
  await login(page, ACCOUNTS.vet);

  await page.goto("/panel/hayvanlar");
  await expect(page).toHaveURL(/\/panel\/hayvanlar$/);

  await page.goto("/panel/finans");
  await expect(page).toHaveURL(/\/panel$/);
});

test("kisisel sayfalar bolum kisitina takilmaz", async ({ page }) => {
  await login(page, ACCOUNTS.worker);

  // Profil herkese aciktir; menude bir "bolum" olmamasi erisimi engellememeli.
  await page.goto("/panel/profil");
  await expect(page).toHaveURL(/\/panel\/profil$/);
});
