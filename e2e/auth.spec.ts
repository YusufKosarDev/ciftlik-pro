import { test, expect } from "@playwright/test";

// Bu testler seed verisini kullanir: admin@ciftlik.com / sifre1234

test("oturumsuz kullanici korunan sayfadan giris'e yonlendirilir", async ({
  page,
}) => {
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/giris/);
  // Giris sayfasi render oldu mu: form gonder butonu gorunur olmali.
  await expect(page.getByRole("button", { name: "Giriş Yap" })).toBeVisible();
});

test("gecerli bilgilerle giris yapilip panele ulasilir", async ({ page }) => {
  await page.goto("/giris");

  await page.getByLabel("E-posta").fill("admin@ciftlik.com");
  await page.getByLabel("Parola").fill("sifre1234");
  await page.getByRole("button", { name: "Giriş Yap" }).click();

  // Panele yonlendirilmeli ve karsilama gorunmeli
  await expect(page).toHaveURL(/\/panel/);
  await expect(page.getByRole("heading", { name: "Panel" })).toBeVisible();
});

test("hatali parola ile giris reddedilir", async ({ page }) => {
  await page.goto("/giris");

  await page.getByLabel("E-posta").fill("admin@ciftlik.com");
  await page.getByLabel("Parola").fill("yanlisparola");
  await page.getByRole("button", { name: "Giriş Yap" }).click();

  // Giris sayfasinda kalmali ve hata gostermeli
  await expect(page.getByText("E-posta veya parola hatalı")).toBeVisible();
});

test("herkese acik kayit sayfasi yoktur (yalnizca ADMIN personel ekler)", async ({
  page,
}) => {
  // Public self-registration kaldirildi: giris ekraninda "Kayit Ol" baglantisi
  // bulunmaz ve /kayit rotasi 404 doner.
  await page.goto("/giris");
  await expect(page.getByRole("link", { name: "Kayıt Ol" })).toHaveCount(0);

  const res = await page.goto("/kayit");
  expect(res?.status()).toBe(404);
});

