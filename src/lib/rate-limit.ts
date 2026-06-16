// Basit, bagimliliksiz hiz sinirlayici (sabit pencere sayaci).
//
// NEDEN BOYLE: Harici bir Redis (orn. Upstash) provizyonu gerektirmeden,
// bellek-ici calisan bir sinirlayici. Tek ornekli/yerel/demo dagitimda gercek
// koruma saglar. Serverless'ta her ornek kendi sayacini tutar; coklu ornekte
// koruma orneklere bolunur (yani daha gevsek). Dagitik kesinlik gerektiginde
// `rateLimit` govdesini Upstash Ratelimit ile degistirmek yeterli — arayuz ayni.

export type RateLimitResult = {
  success: boolean; // Istek izinli mi?
  remaining: number; // Pencerede kalan deneme hakki
  retryAfterSec: number; // Engellendiyse, kac saniye sonra tekrar denenebilir
};

type Bucket = { count: number; resetAt: number };

// Anahtar -> sayac. Modul kapsaminda tutulur (ornek omru boyunca yasar).
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

// Bir anahtar icin sabit pencere sinir kontrolu. Her cagri bir deneme sayar.
//   limit    : pencere basina izin verilen deneme sayisi
//   windowMs : pencere uzunlugu (ms)
//   now      : test edilebilirlik icin enjekte edilebilir saat
export function rateLimit(
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

// Test/yardimci: belirli bir anahtarin sayacini sifirlar.
export function resetRateLimit(key: string): void {
  store.delete(key);
}

// Bir Request'ten istemci IP'sini cikarir (proxy/Vercel basliklari oncelikli).
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
