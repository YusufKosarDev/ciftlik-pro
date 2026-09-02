// Builds the landing page's showcase images from the README screenshots.
//
// Run: node scripts/showcase-images.mjs
//
// WHY A SEPARATE SCRIPT: scripts/shots.mjs captures screenshots from the live
// demo at deviceScaleFactor 2, which is right for a README rendered on GitHub —
// 2880x1800 PNGs of roughly 300 KB each. Shipping those to every visitor of the
// landing page would be careless. This script is a pure transform: it takes what
// shots.mjs produced and emits a width-capped WebP for the browser, so the
// capture step and the delivery step stay independent and either can be rerun on
// its own.
//
// WHY NOT next/image: it would do this resizing automatically, but it does it by
// making `sharp` a runtime dependency of the server. This project's README argues
// that the open `sharp` advisory is unreachable precisely because next/image is
// never imported, and that argument has to stay true. Optimising ahead of time
// keeps sharp where it already is — a build-time tool — and the pages ship plain
// <img> tags with explicit dimensions, which is also what keeps CLS at 0.
//
// BOTH LOCALES: docs/screenshots holds the Turkish UI and docs/screenshots/en the
// English one. The landing page picks by active locale, so a Turkish visitor is
// not shown English screenshots on a page that is otherwise fully translated.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Capture source (per locale) -> public/showcase/<locale>/
const SOURCES = {
  tr: "docs/screenshots",
  en: "docs/screenshots/en",
};

// The three screens that tell the product story: the dashboard, one detail page
// deep enough to show the charts, and the public storefront that makes the point
// this is more than an internal panel.
const IMAGES = ["dashboard.png", "animal-detail.png", "store.png"];

// 1280 CSS px is the widest the landing page ever renders these; on a 2x display
// the browser upscales slightly, which is invisible for a screenshot in a frame
// and roughly a quarter of the bytes of a 2560px variant.
const WIDTH = 1280;
const QUALITY = 80;

async function run() {
  let total = 0;

  for (const [locale, dir] of Object.entries(SOURCES)) {
    const outDir = `public/showcase/${locale}`;
    await mkdir(outDir, { recursive: true });

    for (const name of IMAGES) {
      const out = `${outDir}/${name.replace(/\.png$/, ".webp")}`;
      const buffer = await sharp(`${dir}/${name}`)
        .resize({ width: WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();

      await writeFile(out, buffer);
      total += buffer.length;
      console.log("✓", out, `${(buffer.length / 1024).toFixed(0)} KB`);
    }
  }

  console.log(`\nTotal ${(total / 1024).toFixed(0)} KB across both locales.`);
  console.log("Dimensions are hard-coded in src/app/page.tsx — update them if WIDTH changes.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
