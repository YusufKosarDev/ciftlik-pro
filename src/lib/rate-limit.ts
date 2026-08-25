import { prisma } from "@/lib/prisma";

// Hiz sinirlayici (sabit pencere sayaci).
//
// SAYAC NEREDE TUTULUR: Postgres. Bellek-ici bir sayac tek ornekte dogru
// calisir, ama serverless'ta (Vercel) her ornek kendi sayacini tuttugu icin
// koruma ornek sayisina bolunur — 3 ornek, 3 kat daha gevsek limit demektir.
// Paylasilan tek bir sayac icin zaten elimizde olan veritabanini kullaniyoruz;
// yeni bir servis (Redis vb.) ve yeni bir gizli anahtar gerektirmez.
//
// ATOMIKLIK: Artirma TEK bir INSERT ... ON CONFLICT DO UPDATE ile yapilir ve
// guncel sayaci RETURNING ile geri verir. Oku-sonra-yaz yaris kosulu yoktur:
// es zamanli iki istek de sayilir.
//
// DAYANIKLILIK: Veritabanina ulasilamazsa istek REDDEDILMEZ; bellek-ici
// sayaca dusulur (fail-open). Hiz siniri bir guvenlik derinligi katmanidir,
// tek basina bir kapi degil — DB kesintisinde girisi tamamen kilitlemek
// (fail-closed) korumadan daha buyuk bir zarar olurdu.

export type RateLimitResult = {
  success: boolean; // Istek izinli mi?
  remaining: number; // Pencerede kalan deneme hakki
  retryAfterSec: number; // Engellendiyse, kac saniye sonra tekrar denenebilir
};

// --- Bellek-ici uygulama (yedek + birim testleri) ---------------------------

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Bellek sismesini onlemek icin kaba bir ust sinir; asilirsa suresi gecmisler
// temizlenir, hala buyukse en eski girisler atilir.
const MAX_KEYS = 10_000;

function sweep(now: number): void {
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
  if (store.size > MAX_KEYS) {
    const overflow = store.size - MAX_KEYS;
    let i = 0;
    for (const key of store.keys()) {
      if (i++ >= overflow) break;
      store.delete(key);
    }
  }
}

/**
 * Bellek-ici sabit pencere sayaci. Dogrudan kullanilmaz; `rateLimit` bunu
 * yalnizca veritabanina ulasilamadiginda yedek olarak cagirir. Saf ve
 * senkron oldugu icin birim testleri bunun uzerinden yazilir.
 */
export function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  const existing = store.get(key);

  // Pencere yok ya da suresi gecmis -> yeni pencere baslat.
  if (!existing || existing.resetAt <= now) {
    if (store.size > MAX_KEYS) sweep(now);
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  // Pencere dolu -> engelle.
  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfterSec: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: limit - existing.count,
    retryAfterSec: 0,
  };
}

// --- Paylasilan (veritabani) uygulama ---------------------------------------

type CounterRow = { count: number; resetAt: Date };

/**
 * Bir anahtar icin sabit pencere sinir kontrolu. Her cagri bir deneme sayar.
 *   limit    : pencere basina izin verilen deneme sayisi
 *   windowMs : pencere uzunlugu (ms)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    // Tek atomik adim: satir yoksa 1'den baslat; varsa penceresi gecmisse
    // sifirla, gecmemisse artir. RETURNING guncel degeri verir.
    const rows = await prisma.$queryRaw<CounterRow[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"
    `;

    const row = rows[0];
    if (!row) return rateLimitMemory(key, limit, windowMs, now.getTime());

    if (row.count > limit) {
      return {
        success: false,
        remaining: 0,
        retryAfterSec: Math.max(
          1,
          Math.ceil((new Date(row.resetAt).getTime() - now.getTime()) / 1000)
        ),
      };
    }
    return { success: true, remaining: limit - row.count, retryAfterSec: 0 };
  } catch (error) {
    // Veritabani erisilemez: fail-open + bellek-ici yedek (bkz. dosya basi).
    console.error("Hiz siniri sayaci veritabanina yazilamadi:", error);
    return rateLimitMemory(key, limit, windowMs, now.getTime());
  }
}

/** Yalnizca bellek-ici sayaci sifirlar (yedek yol + birim testleri). */
export function resetRateLimitMemory(key: string): void {
  store.delete(key);
}

/** Belirli bir anahtarin sayacini sifirlar (orn. basarili giristen sonra). */
export async function resetRateLimit(key: string): Promise<void> {
  resetRateLimitMemory(key);
  try {
    await prisma.rateLimit.deleteMany({ where: { key } });
  } catch (error) {
    console.error("Hiz siniri sayaci silinemedi:", error);
  }
}

/**
 * Suresi gecmis sayaclari temizler. Gunluk cron tarafindan cagrilir; tablo
 * sinirsiz buyumesin diye. Silinen satir sayisini doner.
 */
export async function pruneRateLimits(): Promise<number> {
  try {
    const { count } = await prisma.rateLimit.deleteMany({
      where: { resetAt: { lte: new Date() } },
    });
    return count;
  } catch (error) {
    console.error("Hiz siniri temizligi basarisiz:", error);
    return 0;
  }
}

// Bir Request'ten istemci IP'sini cikarir (proxy/Vercel basliklari oncelikli).
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
