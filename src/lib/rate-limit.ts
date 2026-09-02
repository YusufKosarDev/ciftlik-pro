import { prisma } from "@/lib/prisma";

// Rate limiter (fixed-window counter).
//
// WHERE THE COUNTER LIVES: Postgres. An in-memory counter is correct on a single
// instance, but on serverless (Vercel) every instance keeps its own, so the
// protection is divided by the instance count — three instances mean a limit
// three times looser. A single shared counter uses the database we already have;
// it needs no new service (Redis and friends) and no new secret.
//
// ATOMICITY: the increment is one INSERT ... ON CONFLICT DO UPDATE that returns
// the current count via RETURNING. There is no read-then-write race: two
// concurrent requests are both counted.
//
// RESILIENCE: if the database is unreachable the request is NOT refused; the
// limiter falls back to the in-memory counter (fail-open). Rate limiting is a
// defence-in-depth layer, not a gate on its own — locking everyone out of sign-in
// during a database blip would do more damage than it prevents.

export type RateLimitResult = {
  success: boolean; // Is the request allowed?
  remaining: number; // Attempts left in the window
  retryAfterSec: number; // If blocked, how many seconds until a retry is allowed
};

// --- In-memory implementation (fallback + unit tests) -----------------------

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// A rough ceiling to stop memory growth; when exceeded, expired entries are
// swept, and if it is still too large the oldest entries are dropped.
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
 * In-memory fixed-window counter. Not used directly; `rateLimit` calls it as a
 * fallback only when the database is unreachable. It is pure and synchronous,
 * which is why the unit tests are written against it.
 */
export function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  const existing = store.get(key);

  // No window, or the window has expired -> start a new one.
  if (!existing || existing.resetAt <= now) {
    if (store.size > MAX_KEYS) sweep(now);
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  // Window is full -> block.
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

// --- Shared (database) implementation ---------------------------------------

type CounterRow = { count: number; resetAt: Date };

/**
 * Fixed-window limit check for one key. Every call counts as one attempt.
 *   limit    : attempts allowed per window
 *   windowMs : window length (ms)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    // One atomic step: start at 1 when the row is absent; when it exists, reset
    // it if the window has passed, otherwise increment. RETURNING gives back the
    // current value.
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
    // Database unreachable: fail open onto the in-memory counter (see the note at
    // the top of this file).
    console.error("Could not write the rate limit counter to the database:", error);
    return rateLimitMemory(key, limit, windowMs, now.getTime());
  }
}

/** Resets only the in-memory counter (fallback path + unit tests). */
export function resetRateLimitMemory(key: string): void {
  store.delete(key);
}

/** Resets the counter for one key (e.g. after a successful sign-in). */
export async function resetRateLimit(key: string): Promise<void> {
  resetRateLimitMemory(key);
  try {
    await prisma.rateLimit.deleteMany({ where: { key } });
  } catch (error) {
    console.error("Could not delete the rate limit counter:", error);
  }
}

/**
 * Removes expired counters so the table does not grow without bound. Called by
 * the daily cron. Returns the number of rows deleted.
 */
export async function pruneRateLimits(): Promise<number> {
  try {
    const { count } = await prisma.rateLimit.deleteMany({
      where: { resetAt: { lte: new Date() } },
    });
    return count;
  } catch (error) {
    console.error("Rate limit cleanup failed:", error);
    return 0;
  }
}

// Extracts the client IP from a Request (proxy / Vercel headers take priority).
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
