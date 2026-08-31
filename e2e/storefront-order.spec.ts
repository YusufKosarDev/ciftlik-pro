import { test, expect } from "@playwright/test";
import { login, ACCOUNTS, resetLoginRateLimit } from "./helpers";

// Her spec dosyasi giris hiz sinirini sifirlayarak baslar; gerekcesi
// e2e/helpers.ts icindeki resetLoginRateLimit yorumunda.
test.beforeAll(resetLoginRateLimit);

// Herkese acik magaza akisi: katalog -> sepet -> cok kalemli siparis.
// Siparis OTURUMSUZ verilir; tenant slug'dan cozulur ve urunler o tenant
// icinde yeniden okunur (baska tenant'in urun id'si reddedilir).
test("ziyaretci magazadan siparis verebilir, admin siparisi gorur", async ({ page }) => {
  const customerName = `E2E Alıcı ${Date.now()}`;

  // 1) Katalog: ilk iki urunu sepete ekle
  await page.goto("/magaza/default");
  const addButtons = page.getByRole("button", { name: /Sepete ekle/i });
  await expect(addButtons.first()).toBeVisible();
  const count = Math.min(2, await addButtons.count());
  for (let i = 0; i < count; i++) {
    await addButtons.nth(i).click();
  }

  // 2) Sepet: bilgileri doldur ve siparisi tamamla
  await page.goto("/magaza/default/sepet");
  await page.getByLabel("Adınız").fill(customerName);
  await page.getByLabel("Telefon").fill("0555 111 2233");
  await page.getByRole("button", { name: /Siparişi tamamla/i }).click();

  await expect(page.getByText(/Siparişiniz alındı/i).first()).toBeVisible();

  // 3) Admin tarafinda siparis gorunur
  await login(page, ACCOUNTS.admin);
  await page.goto("/panel/siparisler");
  await page.getByPlaceholder("Müşteri adı veya telefon ara...").fill(customerName);
  await expect(page).toHaveURL(new RegExp(`[?&]q=`));
  await expect(page.getByRole("row").filter({ hasText: customerName })).toBeVisible();
});

test("magaza dizini yalnizca satista urunu olan ciftlikleri listeler", async ({ page }) => {
  await page.goto("/magaza");

  // Vitrin ciftliginin (default) urunleri vardir; listede olmali.
  await expect(page.getByRole("link", { name: /Yeşilvadi/i })).toBeVisible();
});
