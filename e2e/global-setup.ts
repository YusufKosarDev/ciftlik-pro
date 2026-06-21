import net from "net";

/**
 * Playwright global setup: E2E testlerinden once PostgreSQL'in erisimlebilir
 * oldugunu dogrular. Eger veritabani kapali ise testler anlamli bir hata
 * mesajiyla fail eder; "login basarisiz" gibi yaniltici hatalar gorulmez.
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

export default async function globalSetup() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  // postgresql://user:pass@HOST:PORT/db
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
      `        npx prisma db push && npx ts-node prisma/seed.ts\n`
    );
  }

  console.log(`✓ Veritabanı erişilebilir (${host}:${port})`);
}
