// Demo (vitrin) verisi CLI sarmalayicisi.
//
// Asil icerik ve mantik src/lib/demo-data.ts icindedir (TEK KAYNAK); burasi
// yalnizca komut satirindan cagirir. Ayni fonksiyon uretim derlemesinde ve
// gecelik cron'da da kullanilir.
//
// Kullanim:
//   npm run db:seed-demo           -> surum eskiyse/tenant bossa kurar
//   npm run db:seed-demo -- --reset -> kosulsuz sifirlar ve yeniden kurar
import { prisma } from "../src/lib/prisma";
import { seedDemo, DEMO_EMAIL, DEMO_PASSWORD } from "../src/lib/demo-data";

const reset = process.argv.includes("--reset");

seedDemo({ reset })
  .then((result) => {
    if (result.seeded) {
      console.log(`Demo veri yuklendi (surum ${result.version}, sebep: ${result.reason}).`);
      console.log(`Demo giris: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    } else {
      console.log(`Demo veri zaten guncel (surum ${result.version}); degisiklik yapilmadi.`);
    }
  })
  .catch((error) => {
    console.error("Demo seed hatasi:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
