import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
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
