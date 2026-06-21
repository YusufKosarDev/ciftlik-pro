import net from "net";

const BASE_URL = "http://localhost:3000";

/**
 * Playwright global setup:
 * 1. PostgreSQL erişilebilirliğini doğrular.
 * 2. Dev server'ı ısıtır (warm-up): auth rotaları dahil kritik
 *    endpoint'lere istek göndererek Turbopack'in ilk derlemeyi tamamlamasını
 *    sağlar. Bu olmadan paralel testler "cold compile" nedeniyle auth timeout'a düşer.
 */
async function checkDbConnection(host: string, port: number, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("timeout", () => { socket.destroy(); resolve(false); });
    socket.once("error", () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

async function warmupServer(maxWaitMs = 60_000): Promise<void> {
  const start = Date.now();
  // Dev server hazır olana kadar bekle
  while (Date.now() - start < maxWaitMs) {
    try {
      await fetch(`${BASE_URL}/api/auth/session`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Auth callback rotasını önceden derlet: CSRF token alarak route'u ısıt.
  // Bu istek başarısız olur (token yok) ama derlemeyi tetikler.
  try {
    await fetch(`${BASE_URL}/api/auth/csrf`);
  } catch {
    // Önemli değil — sadece derlemeyi başlatmak istiyoruz
  }

  // Derlemenin bitmesi için kısa süre bekle
  await new Promise((r) => setTimeout(r, 3000));
  console.log("✓ Dev server ısındı, testler başlıyor...");
}

export default async function globalSetup() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const match = dbUrl.match(/@([^:/]+):(\d+)\//);
  const host = match?.[1] ?? "localhost";
  const port = parseInt(match?.[2] ?? "5433", 10);

  const ok = await checkDbConnection(host, port);
  if (!ok) {
    throw new Error(
      `\n\n❌  E2E testleri için PostgreSQL erişilemiyor (${host}:${port}).\n` +
      `    Lütfen önce veritabanını başlatın:\n\n` +
      `        docker compose up -d db\n\n` +
      `    Ardından seed varsa:\n\n` +
      `        npm run db:seed\n`
    );
  }

  console.log(`✓ Veritabanı erişilebilir (${host}:${port})`);
  await warmupServer();
}
