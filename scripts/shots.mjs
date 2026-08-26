// Canli demodan ekran goruntusu yakalar (headless Chromium, Playwright).
// Demo hesabi salt-okunur ADMIN oldugundan tum modul sayfalari (finans,
// abonelik, personel dahil) + public /magaza cekilebilir.
// Calistir: node scripts/shots.mjs
import { chromium } from "@playwright/test";
import { createRequire } from "node:module";

const BASE = process.env.SHOT_BASE ?? "https://ciftlik-pro.vercel.app";
// Dil: NEXT_LOCALE cookie'si + tarayici locale'i. Varsayilan tr (mevcut davranis).
// EN kosusu: SHOT_LOCALE=en node scripts/shots.mjs
const LOCALE = process.env.SHOT_LOCALE === "en" ? "en" : "tr";
const DIR = LOCALE === "en" ? "docs/screenshots/en" : "docs/screenshots";
// Metne dayali seciciler ceviri katalogundan okunur: uygulamayla TEK KAYNAK,
// boylece dil degistiginde script sessizce kirilmaz.
const msg = createRequire(import.meta.url)(`../messages/${LOCALE}.json`);
const DIALOG = '[role="dialog"][aria-labelledby="onboarding-title"]';

async function waitReady(page) {
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await page.waitForSelector("h1", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(900);
}

// Grafikli sayfalar: Recharts next/dynamic ile tembel yuklendiginden, ekran
// goruntusu alinmadan once en az bir grafigin cizilmis olmasini bekle.
async function waitCharts(page) {
  await page.waitForSelector(".recharts-surface", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

// Onboarding modal'i (varsa) kapatir — demo kullanici onboardedAt=null oldugundan
// her tam yenilemede yeniden acilabilir; bu yuzden her ekrandan once cagrilir.
async function dismiss(page) {
  const dialog = page.locator(DIALOG);
  if ((await dialog.count()) && (await dialog.isVisible().catch(() => false))) {
    await page.locator('[data-testid="onboarding-close"]').click().catch(() => {});
    await page.waitForSelector(DIALOG, { state: "detached", timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

async function shot(page, path) {
  await page.screenshot({ path: `${DIR}/${path}` });
  console.log("✓", path);
}

async function go(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await dismiss(page);
}

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: LOCALE === "en" ? "en-US" : "tr-TR",
  });
  // Uygulama dili cookie'den okur; baslik yalniz cookie yokken devreye girer.
  await ctx.addCookies([{ name: "NEXT_LOCALE", value: LOCALE, url: BASE }]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);

  // 1) Giris -> demo
  await page.goto(`${BASE}/giris`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await page.getByRole("button", { name: msg.Login.demo }).click();
  await page.waitForURL(/\/panel$/);
  await waitReady(page);

  // 2) Onboarding modal (acikken) — sonra kapat
  if (await page.locator(DIALOG).isVisible().catch(() => false)) {
    await shot(page, "onboarding.png");
  }
  await dismiss(page);

  // 3) Dashboard (acik tema)
  await go(page, "/panel");
  await shot(page, "dashboard.png");

  // 4) Dashboard (koyu tema)
  const toggle = page.getByRole("button", {
    name: new RegExp(`${msg.Common.toDarkTheme}|${msg.Common.toLightTheme}`, "i"),
  });
  if (await toggle.count()) {
    await toggle.first().click();
    await page.waitForTimeout(700);
    await shot(page, "dashboard-dark.png");
    await toggle.first().click();
    await page.waitForTimeout(500);
  }

  // 5) Hayvanlar + hayvan detayi
  await go(page, "/panel/hayvanlar");
  await shot(page, "animals.png");
  // "Yeni Hayvan" (/panel/hayvanlar/yeni) degil, gercek bir hayvan satiri:
  // demo salt-okunur oldugundan form sayfalari /panel'e yonlendirir.
  // Grafikli detay icin sut verimi olan hayvani (TR-1001 Sarikiz) tercih et.
  const rows = page.locator('a[href^="/panel/hayvanlar/"]:not([href$="/yeni"])');
  const withCharts = rows.filter({ hasText: /Sarıkız|TR-1001/i });
  const firstAnimal = (await withCharts.count()) ? withCharts.first() : rows.first();
  if (await firstAnimal.count()) {
    await firstAnimal.click();
    await page.waitForURL(/\/panel\/hayvanlar\/.+/, { timeout: 20000 }).catch(() => {});
    await waitReady(page);
    await dismiss(page);
    await waitCharts(page);
    await shot(page, "animal-detail.png");
  }

  // 6-8) Harita / Takvim / Yem
  await go(page, "/panel/harita");
  await shot(page, "map.png");
  await go(page, "/panel/takvim");
  await shot(page, "calendar.png");
  await go(page, "/panel/yem");
  await shot(page, "feed.png");

  // 9-11) Finans / Abonelik (plan + kullanim panosu) / Personel
  await go(page, "/panel/finans");
  await waitCharts(page);
  await shot(page, "finance.png");
  await go(page, "/panel/abonelik");
  await shot(page, "billing.png");
  await go(page, "/panel/personel");
  // Vitrin disi (ciftlik.com olmayan) gercek e-postalari goruntude maskele —
  // yalnizca ekran goruntusu icin DOM'da; canli veriye dokunmaz.
  await page.evaluate(() => {
    const re = /\b([a-z0-9])[a-z0-9._%+-]*@(?!ciftlik\.com)[a-z0-9.-]+\.[a-z]{2,}\b/gi;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      n.textContent = n.textContent.replace(re, (_, first) => `${first}•••••••@•••.com`);
    }
  });
  await shot(page, "staff.png");

  // 12) Magaza (public) — dizin yerine urunlu tenant katalogu (vitrin verisi).
  await go(page, "/magaza/default");
  await shot(page, "store.png");

  await browser.close();
  console.log("Bitti.");
}

run().catch((e) => {
  console.error("Ekran görüntüsü hatası:", e);
  process.exit(1);
});
