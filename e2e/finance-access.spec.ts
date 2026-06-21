import { test, expect } from "@playwright/test";
import { login, ACCOUNTS } from "./helpers";

// Adim 1 guvenlik duzeltmesinin dogrulamasi:
// WORKER rolu finans verisini ne menude gorur ne de dogrudan URL ile acabilir.
test("WORKER finans sayfasina erisemez", async ({ page }) => {
  await login(page, ACCOUNTS.worker);

  // Menude finans baglantisi gorunmemeli
  await expect(page.getByRole("link", { name: "Finans" })).toHaveCount(0);

  // Dogrudan URL ile gidilse bile panele yonlendirilmeli
  await page.goto("/panel/finans");
  await expect(page).toHaveURL(/\/panel$/);
});

// ADMIN finansi normal sekilde gorebilmeli (regresyon koruması).
test("ADMIN finans sayfasini gorebilir", async ({ page }) => {
  await login(page, ACCOUNTS.admin);
  await page.goto("/panel/finans");
  await expect(page).toHaveURL(/\/panel\/finans$/);
  // Sayfada birden fazla h1 olabileceginden sayfa basligini emoji ile eslestirelim.
  await expect(page.getByRole("heading", { name: "💰 Finans" })).toBeVisible();
});
