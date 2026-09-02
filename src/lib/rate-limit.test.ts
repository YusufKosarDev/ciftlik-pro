import { describe, it, expect, beforeEach } from "vitest";

// Note: these tests target the PURE, synchronous in-memory implementation. The
// shared (Postgres) path needs a database and is verified by an integration test
// (rate-limit.int.test.ts).
import { rateLimitMemory as rateLimit, resetRateLimitMemory as resetRateLimit, clientIp } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimit("k");
  });

  it("limit altindaki denemelere izin verir", () => {
    const t = 1_000_000;
    expect(rateLimit("k", 3, 60_000, t).success).toBe(true);
    expect(rateLimit("k", 3, 60_000, t).success).toBe(true);
    const third = rateLimit("k", 3, 60_000, t);
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("limit asilinca engeller ve retryAfter doner", () => {
    const t = 2_000_000;
    rateLimit("k", 2, 60_000, t);
    rateLimit("k", 2, 60_000, t);
    const blocked = rateLimit("k", 2, 60_000, t);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it("pencere dolunca sayac sifirlanir", () => {
    const t = 3_000_000;
    rateLimit("k", 1, 60_000, t);
    expect(rateLimit("k", 1, 60_000, t).success).toBe(false);
    // Allowed again once the window has passed.
    expect(rateLimit("k", 1, 60_000, t + 60_001).success).toBe(true);
  });

  it("farkli anahtarlar bagimsiz sayilir", () => {
    const t = 4_000_000;
    rateLimit("a", 1, 60_000, t);
    expect(rateLimit("a", 1, 60_000, t).success).toBe(false);
    expect(rateLimit("b", 1, 60_000, t).success).toBe(true);
  });
});

describe("sweep — bellek korumasi (MAX_KEYS)", () => {
  it("MAX_KEYS asilinca suresi gecmis girisleri temizler ve boyutu sinirlar", () => {
    const base = 50_000_000;
    // A few short-lived entries: they count as expired later on.
    for (let i = 0; i < 5; i++) rateLimit(`exp-${i}`, 1, 1_000, base);

    // exp-* has now expired (resetAt = base + 1000 <= later).
    const later = base + 2_000;
    // Add enough live entries to exceed MAX_KEYS (10,000).
    for (let i = 0; i < 10_001; i++) rateLimit(`act-${i}`, 1, 60_000, later);

    // A new key triggers the sweep (store.size > MAX_KEYS).
    const r = rateLimit("trigger", 1, 60_000, later);
    expect(r.success).toBe(true);

    // An expired key was swept, so it starts again with a full window.
    const reused = rateLimit("exp-0", 1, 60_000, later);
    expect(reused.success).toBe(true);
  });
});

describe("clientIp", () => {
  it("x-forwarded-for'daki ilk IP'yi alir", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientIp(req)).toBe("1.2.3.4");
  });

  it("x-real-ip'e geri duser", () => {
    const req = new Request("http://x", { headers: { "x-real-ip": "9.9.9.9" } });
    expect(clientIp(req)).toBe("9.9.9.9");
  });

  it("baslik yoksa 'unknown' doner", () => {
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
