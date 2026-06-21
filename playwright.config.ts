import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  // CI'da dev sunucusunun ilk rota derlemesi (cold compile) yavas olabilir;
  // paralel worker'lar bu yuku artirip kararsizliga yol acar. CI'da tek
  // worker + birkac deneme ile deterministik hale getiriyoruz.
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  // Varsayilan 5sn, cold compile'da yetersiz kalabiliyor.
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    navigationTimeout: 15000,
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
