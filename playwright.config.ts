import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  // Dev sunucusunun ilk rota derlemesi (cold compile) yavastir; paralel
  // worker'lar ayni anda farkli rotalari derletince testler zaman asimina
  // ugruyor. Tek worker hem deterministik hem de pratikte DAHA HIZLI
  // (derlemeler sirayla, tekrar tekrar degil): 18 test ~50sn.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  // Varsayilan 5sn, cold compile'da yetersiz kalabiliyor.
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    navigationTimeout: 15000,
    // Testler Turkce metin seciciler kullanir ("Giris Yap", "Hayvan Ekle"...).
    // Uygulama, cookie yoksa dili Accept-Language'den secer; Chromium varsayilani
    // en-US oldugundan bu sabitleme olmadan tum suite Ingilizceye duser ve
    // seciciler kirilirdi. Dil kapsamini e2e degil, birim testleri dogrular
    // (src/i18n/resolve-locale.test.ts).
    locale: "tr-TR",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Testlerden once dev sunucusunu otomatik baslat (zaten ayaktaysa tekrar kullan).
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
