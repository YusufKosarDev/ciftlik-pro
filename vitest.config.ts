import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true, // Testing Library otomatik cleanup'i (global afterEach) icin
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      // Kapsam, birim testiyle olculen is mantigi ile sinirli tutulur.
      // UI bilesenleri/sayfalari uctan uca (Playwright) testleriyle kapsanir;
      // saf altyapi (prisma/auth baglantilari) birim testine uygun degildir.
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/lib/prisma.ts",
        "src/lib/auth.ts",
        "src/lib/auth.config.ts",
        // Harici servis sarmalayicisi (Resend); birim testi yerine entegrasyonla dogrulanir
        "src/lib/email.ts",
        // Stripe istemci sarmalayicisi (email.ts ile ayni kategori): harici servis
        // baglantisi; gercek odeme akisi e2e/entegrasyonla dogrulanir.
        "src/lib/stripe.ts",
        // Prisma/auth altyapi sarmalayicilari (prisma.ts/auth.ts ile ayni kategori):
        // tenant-kapsamli istemci ve SET LOCAL transaction'i, tenant-izolasyon
        // entegrasyon testleriyle (tenant-prisma.int / tenant-rls.int) dogrulanir.
        "src/lib/tenant-prisma.ts",
        "src/lib/tenant.ts",
        // Denetim kaydi yazma sarmalayicisi (DB yan etkisi); birim testine uygun degil,
        // yazma akislariyla (entegrasyon/e2e) dolayli kapsanir.
        "src/lib/audit.ts",
        // Saf sabit/yardimci dosyalar (dallanma mantigi yok)
        "src/lib/labels.ts",
        "src/lib/cn.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
