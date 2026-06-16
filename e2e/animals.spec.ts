import { test, expect } from "@playwright/test";
import { login, ACCOUNTS } from "./helpers";

const SEARCH = "Kulak no, ad veya ırk ara...";

// ADMIN olarak hayvan ekle -> listede ara -> duzenle -> sil akisi.
// Benzersiz kulak numarasi kullanarak tekrar tekrar calistirilabilir.
test("admin hayvan ekleyip duzenleyip silebilir", async ({ page }) => {
  const tag = `E2E-${Date.now()}`;

  await login(page, ACCOUNTS.admin);

  // 1) Ekleme
  await page.goto("/panel/hayvanlar/yeni");
  await page.getByLabel("Kulak No").fill(tag);
  await page.getByLabel("Ad").fill("Test Hayvan");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/panel\/hayvanlar$/);

  // 2) Tabloda arama ile bul. Arama sunucu tarafinda (debounce'lu) calistigi
  //    icin, etkilesimleri tag iceren SATIRA kapsayarak liste daralmadan once
  //    coklu eslesmeyi (strict-mode hatasi) onleriz.
  await page.getByPlaceholder(SEARCH).fill(tag);
  const row = page.getByRole("row").filter({ hasText: tag });
  await expect(row.getByRole("cell", { name: tag })).toBeVisible();

  // 3) Duzenleme: adi degistir (aranan satirin Duzenle linki)
  await row.getByRole("link", { name: "Düzenle" }).click();
  await expect(page).toHaveURL(/\/duzenle$/);
  await page.getByLabel("Ad").fill("Test Hayvan Guncel");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/panel\/hayvanlar$/);

  // 4) Silme: arama + onay dialogu (yine satira kapsayarak)
  await page.getByPlaceholder(SEARCH).fill(tag);
  await page.getByRole("row").filter({ hasText: tag }).getByRole("button", { name: "Sil" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Sil" }).click();

  // Silindikten sonra arama sonucu bos olmali
  await page.getByPlaceholder(SEARCH).fill(tag);
  await expect(
    page.getByText(`“${tag}” ile eşleşen kayıt bulunamadı.`)
  ).toBeVisible();
});
