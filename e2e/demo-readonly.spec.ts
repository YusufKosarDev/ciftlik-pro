import { test, expect } from "@playwright/test";

// Demo hesabi vitrindir: ADMIN rolunde oldugu icin TUM ekranlari gezebilir,
// ama hicbir yazma yapamaz. Koruma e-posta tabanlidir (authz.ts isDemoUser),
// yani rolden bagimsizdir — canli demoda veri boyle korunur.
const DEMO = { email: "demo@ciftlik.com", password: "demo1234" };

test("demo hesabi SaaS ekranlarini gezebilir", async ({ page }) => {
  await page.goto("/giris");
  await page.getByRole("button", { name: /Demo olarak gez/i }).click();
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
