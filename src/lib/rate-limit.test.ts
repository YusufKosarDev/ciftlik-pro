import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimit, clientIp } from "./rate-limit";

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
    // Pencere suresi gectikten sonra tekrar izinli.
    expect(rateLimit("k", 1, 60_000, t + 60_001).success).toBe(true);
  });

  it("farkli anahtarlar bagimsiz sayilir", () => {
    const t = 4_000_000;
    rateLimit("a", 1, 60_000, t);
    expect(rateLimit("a", 1, 60_000, t).success).toBe(false);
    expect(rateLimit("b", 1, 60_000, t).success).toBe(true);
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
