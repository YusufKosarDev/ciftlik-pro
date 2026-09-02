import { test, expect } from "@playwright/test";
import { resetLoginRateLimit } from "./helpers";

// Her spec dosyasi giris hiz sinirini sifirlayarak baslar; gerekcesi
// e2e/helpers.ts icindeki resetLoginRateLimit yorumunda.
test.beforeAll(resetLoginRateLimit);

// Kok adres uzun sure `redirect("/panel")` idi; ziyaretci dogrudan giris formuna
// dusuyordu. Bu dosya landing sayfasinin VARLIK SEBEBINI koruyor: CV'deki canli
// link tiklandiginda (1) urunun ne oldugu goruluyor, (2) kaynak koda bir yol
// var, (3) demo hala tek tiklamayla acilabiliyor.
//
// Ucuncusu ozellikle onemli: rol dugmeleri artik ortak bir bilesenden
// (src/components/demo-role-buttons.tsx) geliyor ve giris ekraniyla paylasiliyor.
// Bu test o paylasimin landing tarafini tutuyor; giris tarafini
// e2e/demo-roles.spec.ts ve e2e/demo-readonly.spec.ts tutuyor.

test("kok adres landing sayfasini gosterir, panele yonlendirmez", async ({ page }) => {
  const response = await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  expect(response?.status(), "yonlendirme degil, dogrudan 200 olmali").toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Vitrin gorselleri aktif dile gore secilir (playwright.config locale: tr-TR).
  await expect(page.locator('img[src^="/showcase/tr/"]')).toHaveCount(3);
});

test("landing sayfasindan kaynak koda ve magazaya baglanti vardir", async ({ page }) => {
  await page.goto("/");

  // Ust bar ve alt bilgide ikisi birden; ikisi de ayni depoyu gostermeli.
  const source = page.getByRole("link", { name: "Kaynak kod" });
  await expect(source).toHaveCount(2);
  for (const link of await source.all()) {
    await expect(link).toHaveAttribute(
      "href",
      "https://github.com/YusufKosarDev/ciftlik-pro"
    );
  }

  await expect(
    page.getByRole("link", { name: "Çiftlik mağazası" }).first()
  ).toBeVisible();
});

test("landing sayfasindaki rol dugmesi demo oturumu acar", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Yönetici/i }).click();
  await expect(page).toHaveURL(/\/panel$/);
});
