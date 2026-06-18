// Canli demodan ekran goruntusu yakalar (headless Chromium, Playwright).
// Demo hesabi WORKER oldugundan yalnizca WORKER sayfalari + public /magaza
// cekilebilir. Calistir: node scripts/shots.mjs
import { chromium } from "@playwright/test";

const BASE = process.env.SHOT_BASE ?? "https://ciftlik-pro.vercel.app";
const DIR = "docs/screenshots";
const DIALOG = '[role="dialog"][aria-labelledby="onboarding-title"]';

async function waitReady(page) {
  await page.waitForSelector("h1", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(900);
}

// Onboarding modal'i (varsa) kapatir — demo kullanici onboardedAt=null oldugundan
// her tam yenilemede yeniden acilabilir; bu yuzden her ekrandan once cagrilir.
async function dismiss(page) {
  const dialog = page.locator(DIALOG);
  if ((await dialog.count()) && (await dialog.isVisible().catch(() => false))) {
    await page.locator('[aria-label="Turu kapat"]').click().catch(() => {});
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
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);

  // 1) Giris -> demo
  await page.goto(`${BASE}/giris`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await page.getByRole("button", { name: /Demo olarak gez/i }).click();
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
  const toggle = page.getByRole("button", { name: /temaya geç/i });
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
  const firstAnimal = page.locator('a[href^="/panel/hayvanlar/"]').first();
  if (await firstAnimal.count()) {
    await firstAnimal.click();
    await waitReady(page);
    await dismiss(page);
    await shot(page, "animal-detail.png");
  }

  // 6-8) Harita / Takvim / Yem
  await go(page, "/panel/harita");
  await shot(page, "map.png");
  await go(page, "/panel/takvim");
  await shot(page, "calendar.png");
  await go(page, "/panel/yem");
  await shot(page, "feed.png");

  // 9) Magaza (public, yeni modul)
  await go(page, "/magaza");
  await shot(page, "store.png");

  await browser.close();
  console.log("Bitti.");
}

run().catch((e) => {
  console.error("Ekran görüntüsü hatası:", e);
  process.exit(1);
});
