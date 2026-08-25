import { test, expect } from "@playwright/test";
import { login, ACCOUNTS } from "./helpers";

// Satis kaydi olusturuldugunda ARKA PLANDA bagli bir gelir (INCOME) islemi
// uretilir; ikisi tek transaction icindedir. Bu, uygulamanin en onemli
// veri-tutarliligi kuralidir: satis listesi ile finans defteri asla ayrisamaz.
test("satis olusturmak finansa otomatik gelir islemi yazar", async ({ page }) => {
  const item = `E2E Satış ${Date.now()}`;
  const amount = "12345";

  await login(page, ACCOUNTS.admin);

  await page.goto("/panel/satis/yeni");
  // Not: satis formunun etiketleri sabit metindir (i18n'e bagli degil);
  // getByLabel string ile alt-dizi eslesmesi yapar.
  await page.getByLabel("Satılan").fill(item);
  await page.getByLabel("Tutar (TL)").fill(amount);
  // Tarih zorunlu ve yeni kayitta bos gelir; doldurulmazsa tarayici gonderimi engeller.
  await page.getByLabel("Tarih").fill(new Date().toISOString().slice(0, 10));
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/panel\/satis$/);

  // 1) Satis listesinde gorunur
  await page.getByPlaceholder("Satılan ürün veya açıklama ara...").fill(item);
  await expect(page).toHaveURL(new RegExp(`[?&]q=`));
  await expect(page.getByRole("row").filter({ hasText: item })).toBeVisible();

  // 2) Finansta, ayni aciklamayla bir GELIR islemi olusmustur.
  //    Not: finans tablosunda "aciklama" sutunu yoktur (tarih/tur/kategori/tutar);
  //    bu yuzden aciklamayla ARAYIP donen tek satirin dogru islem oldugunu
  //    kategori + tutar uzerinden dogruluyoruz.
  await page.goto("/panel/finans");
  await page.getByPlaceholder("Kategori veya açıklama ara...").fill(item);
  await expect(page).toHaveURL(new RegExp(`[?&]q=`));

  const row = page.getByRole("row").filter({ hasText: "Satış" });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("12.345");

  // 3) CSV disa aktarimi aciklamayi tasir: satis <-> islem baginin kaniti.
  const csv = await page.request.get("/api/transactions/export");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain(item);
});

test("MUHASEBECI olmayan WORKER satis ekleyemez", async ({ page }) => {
  await login(page, ACCOUNTS.worker);

  // Menude satis yok
  await expect(page.getByRole("link", { name: "Satış" })).toHaveCount(0);

  // Dogrudan URL ile de form acilmaz
  await page.goto("/panel/satis/yeni");
  await expect(page).toHaveURL(/\/panel$/);
});
