import { test, expect } from "@playwright/test";
import { login, ACCOUNTS, resetLoginRateLimit } from "./helpers";

// Her spec dosyasi giris hiz sinirini sifirlayarak baslar; gerekcesi
// e2e/helpers.ts icindeki resetLoginRateLimit yorumunda.
test.beforeAll(resetLoginRateLimit);

// Personel yalnizca TOKEN'LI DAVETLE eklenir. Bu akis uc seyi birden kanitlar:
// davet olusturma (ADMIN), token'la kabul (oturumsuz) ve davetlinin kendi
// rolunun kisitlariyla giris yapabilmesi.
test("ADMIN davet olusturur, davetli kabul eder ve rolüyle giris yapar", async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e-vet-${stamp}@ciftlik.com`;
  const password = "sifre1234";

  // 1) ADMIN davet olusturur (rol: Veteriner)
  await login(page, ACCOUNTS.admin);
  await page.goto("/panel/personel");
  await page.locator("#invite-email").fill(email);
  await page.locator("#invite-role").selectOption("VET");
  await page.getByRole("button", { name: /Davet Gönder|Davet Et/i }).click();

  // Kabul baglantisi ekranda gosterilir
  const link = page.getByText(/\/davet\//).first();
  await expect(link).toBeVisible();
  // Eleman metni URL disinda baska metin de tasiyabilir; token'i regex ile al.
  const match = (await link.innerText()).match(/\/davet\/([A-Za-z0-9_-]+)/);
  const token = match?.[1];
  expect(token, "davet token'i uretilmeli").toBeTruthy();

  // 2) Davetli (oturumsuz) kabul eder
  await page.context().clearCookies();
  await page.goto(`/davet/${token}`);

  const submit = page.getByRole("button", { name: /Katıl/i });
  await expect(submit).toBeEnabled();
  await page.getByLabel("Ad Soyad").fill("E2E Veteriner");
  await page.getByLabel("Parola").fill(password);

  // Kabul cagrisinin BASARILI dondugunu acikca dogrula; aksi halde hata
  // asagida "giris yapilamadi" gibi yaniltici bir yerde patliyor.
  const [acceptResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/accept") && r.request().method() === "POST"),
    submit.click(),
  ]);
  expect(acceptResponse.status(), await acceptResponse.text()).toBe(201);

  // 3) Kabul akisi davetliyi otomatik oturum acar ve panele birakir;
  //    ayrica giris yapmak gerekmez. VET kisitlari andan itibaren gecerlidir.
  await expect(page).toHaveURL(/\/panel$/);

  await page.goto("/panel/hayvanlar");
  await expect(page).toHaveURL(/\/panel\/hayvanlar$/);
  await page.goto("/panel/finans");
  await expect(page, "VET finansi goremez").toHaveURL(/\/panel$/);

  // 4) Ayni token TEKRAR kullanilamaz
  await page.context().clearCookies();
  const res = await page.request.post(`/api/invitations/${token}/accept`, {
    data: { name: "Tekrar", password },
  });
  expect(res.status(), "kullanilmis token 410 donmeli").toBe(410);
});
