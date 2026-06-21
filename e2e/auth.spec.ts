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

  // Panele yonlendirilmeli
  await expect(page).toHaveURL(/\/panel/);
});

test("hatali parola ile giris reddedilir", async ({ page }) => {
  await page.goto("/giris");

  await page.getByLabel("E-posta").fill("admin@ciftlik.com");
  await page.getByLabel("Parola").fill("yanlisparola");
  await page.getByRole("button", { name: "Giriş Yap" }).click();

  // Giris sayfasinda kalmali ve hata gostermeli
  await expect(page.getByText("E-posta veya parola hatalı")).toBeVisible();
});

test("giris sayfasinda genel kayit (Kayit Ol) baglantisi yoktur", async ({
  page,
}) => {
  // Genel self-registration linki kaldiridi; yerine davet tabanli kabulle
  // gelen kullanicilara ozel /kayit sayfasi erisimi var.
  // Giris sayfasinda "Kayit Ol" metni OLMAMALI; "Çiftliğini oluştur" var.
  await page.goto("/giris");
  await expect(page.getByRole("link", { name: "Kayıt Ol" })).toHaveCount(0);
  // Ciftlik sahibi kayit baglantisi mevcut (farkli metin)
  await expect(
    page.getByRole("link", { name: "Çiftliğini oluştur" })
  ).toBeVisible();
});
