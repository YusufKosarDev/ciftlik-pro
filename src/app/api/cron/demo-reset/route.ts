import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { seedDemo } from "@/lib/demo-data";

// GET /api/cron/demo-reset
// Called by the nightly cron (Vercel Cron): wipes the showcase (demo) tenant and
// repopulates it with the current demo data.
//
// WHY: the live demo is public, and the data wears down as visitors explore it —
// the demo account is read-only, but public sign-up and storefront orders are
// still possible. A nightly reset guarantees the demo looks the same, full and
// tidy, on every visit.
//
// Security: the same pattern as /api/cron/alerts — with no CRON_SECRET the
// endpoint is closed (503), and with one the Bearer token is verified.
export async function GET(request: Request) {
  const te = await getTranslations("Errors");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("CRON_SECRET is not set. The endpoint is disabled.");
    return NextResponse.json(
      { error: te("cronSecretMissing") },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
  }

  try {
    const result = await seedDemo({ reset: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Demo reset failed:", error);
    return NextResponse.json({ error: te("serverError") }, { status: 500 });
  }
}
