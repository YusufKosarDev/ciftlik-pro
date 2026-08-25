// README'nin en ustundeki tanitim GIF'ini uretir: demo hesabiyla giris yapip
// panelin ana akisini gezer, kareleri yakalar ve tek bir GIF'e kodlar.
//
// Calistir:
//   node scripts/demo-gif.mjs                        (canli demo)
//   SHOT_BASE=http://localhost:3000 node scripts/demo-gif.mjs
//
// NEDEN kare yakalama: sistemde ffmpeg yok ve Playwright'in WebM videosu
// README'de calismiyor (GitHub depo-yolu videolarini gomemiyor). Kareler
// sharp ile RGBA'ya cozulup gifenc (saf JS) ile kodlanir; ek ikili bagimlilik
// gerekmez.
import { chromium } from "@playwright/test";
// gifenc CommonJS yayinlar; ESM'de adlandirilmis import calismaz.
import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const BASE = process.env.SHOT_BASE ?? "https://ciftlik-pro.vercel.app";
const OUT = "docs/demo.gif";
const DIALOG = '[role="dialog"][aria-labelledby="onboarding-title"]';

// GIF boyutu ile akicilik dengesi: 1200x750 yakala, 900px'e kucult.
const VIEWPORT = { width: 1200, height: 750 };
const GIF_WIDTH = 900;
const FRAME_DELAY = 110; // ms (~9 fps)
const HOLD_DELAY = 900; // Duraklama karesi: okuyucunun ekrani gormesi icin

const frames = [];

async function capture(page, { hold = false } = {}) {
  const png = await page.screenshot({ type: "png" });
  const { data, info } = await sharp(png)
    .resize({ width: GIF_WIDTH })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  frames.push({
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
    delay: hold ? HOLD_DELAY : FRAME_DELAY,
  });
}

// Bir sahneyi kaydet: birkac ara kare + sonda bekleme karesi.
async function scene(page, label, steps = 4) {
  for (let i = 0; i < steps; i++) {
    await page.waitForTimeout(180);
    await capture(page);
  }
  await capture(page, { hold: true });
  console.log(`  · ${label} (${frames.length} kare)`);
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
}

async function dismissOnboarding(page) {
  const dialog = page.locator(DIALOG);
  if ((await dialog.count()) && (await dialog.isVisible().catch(() => false))) {
    await page.locator('[aria-label="Turu kapat"]').click().catch(() => {});
    await page.waitForSelector(DIALOG, { state: "detached", timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
}

async function goto(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await dismissOnboarding(page);
}

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);

  console.log(`GIF kaydi basliyor: ${BASE}`);

  // 1) Giris ekrani -> "Demo olarak gez"
  await goto(page, "/giris");
  await scene(page, "Giris ekrani", 3);
  await page.getByRole("button", { name: /Demo olarak gez/i }).click();
  await page.waitForURL(/\/panel$/, { timeout: 30000 });
  await settle(page);
  await dismissOnboarding(page);

  // 2) Panel: ozet kartlari, aylik grafik, uyarilar
  await scene(page, "Panel (dashboard)", 5);

  // 3) Hayvanlar: sunucu-tarafli arama + sayfalama
  await goto(page, "/panel/hayvanlar");
  await scene(page, "Hayvan listesi", 3);
  const search = page.getByPlaceholder(/Kulak no/i);
  if (await search.count()) {
    await search.first().pressSequentially("Sarı", { delay: 130 });
    await page.waitForTimeout(900);
    await scene(page, "Sunucu-tarafli arama", 3);
  }

  // 4) Hayvan detayi: sut verimi / agirlik grafikleri.
  //    Arama filtresi ACIK birakilir — aranan hayvan (TR-1001) listenin ilk
  //    sayfasinda olmadigindan, filtreliyken tiklamak tek guvenilir yol.
  const row = page.locator('a[href^="/panel/hayvanlar/"]:not([href$="/yeni"])').filter({
    hasText: /Sarıkız|TR-1001/i,
  });
  if (await row.count()) {
    await row.first().click();
    await page.waitForURL(/\/panel\/hayvanlar\/.+/, { timeout: 20000 }).catch(() => {});
    await settle(page);
    await dismissOnboarding(page);
    await page.waitForSelector(".recharts-surface", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(900);
    await scene(page, "Hayvan detayi (grafikler)", 4);
  }

  // 5) Harita ve takvim
  await goto(page, "/panel/harita");
  await scene(page, "2D ciftlik haritasi", 4);
  await goto(page, "/panel/takvim");
  await scene(page, "Takvim", 3);

  // 6) Finans (grafikler)
  await goto(page, "/panel/finans");
  await page.waitForSelector(".recharts-surface", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
  await scene(page, "Finans", 4);

  // 7) Koyu tema
  const toggle = page.getByRole("button", { name: /temaya geç/i });
  if (await toggle.count()) {
    await toggle.first().click();
    await page.waitForTimeout(800);
    await scene(page, "Koyu tema", 3);
  }

  // 8) Herkese acik magaza (per-tenant vitrin)
  await goto(page, "/magaza/default");
  await scene(page, "Ciftlik magazasi", 4);

  await browser.close();

  // --- Kodlama ---
  console.log(`Kodlaniyor: ${frames.length} kare -> ${OUT}`);
  const gif = GIFEncoder();
  for (const frame of frames) {
    // 256 renkli palet her karede yeniden hesaplanir; grafik/tema gecislerinde
    // renk bozulmasini onler.
    const palette = quantize(frame.data, 256, { format: "rgb565" });
    const index = applyPalette(frame.data, palette, "rgb565");
    gif.writeFrame(index, frame.width, frame.height, {
      palette,
      delay: frame.delay,
    });
  }
  gif.finish();
  const bytes = gif.bytes();
  await writeFile(OUT, bytes);
  console.log(`✓ ${OUT} (${(bytes.length / 1024 / 1024).toFixed(2)} MB, ${frames.length} kare)`);
}

run().catch((error) => {
  console.error("GIF uretimi basarisiz:", error);
  process.exitCode = 1;
});
