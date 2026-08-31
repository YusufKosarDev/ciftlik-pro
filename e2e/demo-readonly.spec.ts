import { test, expect } from "@playwright/test";
import { resetLoginRateLimit } from "./helpers";

// Her spec dosyasi giris hiz sinirini sifirlayarak baslar; gerekcesi
// e2e/helpers.ts icindeki resetLoginRateLimit yorumunda.
test.beforeAll(resetLoginRateLimit);

// ADMIN vitrin hesabi TUM ekranlari gezebilir ama hicbir yazma yapamaz.
// Koruma e-posta tabanlidir (authz.ts isDemoUser), yani rolden bagimsizdir —
// canli demoda veri boyle korunur.
//
// Giris ekranindaki tek "Demo olarak gez" dugmesi rol secicisine donustu
// (dort rol, dort dugme); burasi ADMIN dugmesini kullanir. Diger uc rolun
// kendi kapsami e2e/demo-roles.spec.ts'te.
const DEMO = { email: "demo@ciftlik.com", password: "demo1234" };

test("demo hesabi SaaS ekranlarini gezebilir", async ({ page }) => {
  await page.goto("/giris");
  await page.getByRole("button", { name: /Yönetici/i }).click();
  await expect(page).toHaveURL(/\/panel$/);

  // ADMIN'e acik olan bolumler goruntulenebilir
  for (const path of ["/panel/finans", "/panel/personel", "/panel/abonelik", "/panel/denetim"]) {
    await page.goto(path);
    await expect(page, `${path} goruntulenebilmeli`).toHaveURL(new RegExp(`${path}$`));
  }
});

test("demo hesabi yazma yapamaz", async ({ page }) => {
  await page.goto("/giris");
  await page.getByLabel("E-posta").fill(DEMO.email);
  await page.getByLabel("Parola").fill(DEMO.password);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page).toHaveURL(/\/panel$/);

  // 1) Form sayfasi acilmaz (requirePageWrite panele geri gonderir)
  await page.goto("/panel/hayvanlar/yeni");
  await expect(page.locator("form")).toHaveCount(0);

  // 2) API dogrudan cagrilsa bile reddedilir
  const res = await page.request.post("/api/animals", {
    data: { tagNumber: `DEMO-${Date.now()}`, species: "CATTLE", gender: "FEMALE", status: "ACTIVE" },
  });
  expect(res.status()).toBe(403);
  expect((await res.json()).error).toMatch(/salt-okunur/i);
});
