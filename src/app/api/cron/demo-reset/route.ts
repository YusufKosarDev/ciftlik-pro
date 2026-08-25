import { NextResponse } from "next/server";
import { seedDemo } from "@/lib/demo-data";

// GET /api/cron/demo-reset
// Gecelik cron (Vercel Cron) tarafindan cagrilir: vitrin (demo) tenant'ini
// sifirlayip guncel demo verisiyle yeniden doldurur.
//
// NEDEN: Canli demo herkese aciktir; ziyaretciler gezerken veri "yipranir"
// (demo hesabi salt-okunur olsa da acik kayit ve magaza siparisi mumkundur).
// Gecelik sifirlama, demonun her ziyarette ayni dolu ve derli toplu halde
// gorunmesini garanti eder.
//
// Guvenlik: /api/cron/alerts ile ayni desen — CRON_SECRET tanimli degilse
// endpoint kapalidir (503), tanimliysa Bearer token dogrulanir.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("CRON_SECRET ortam degiskeni tanimli degil. Endpoint devre disi.");
    return NextResponse.json(
      { error: "Sunucu yapilandirmasi eksik: CRON_SECRET ayarlanmamis" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const result = await seedDemo({ reset: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Demo sifirlama hatasi:", error);
    return NextResponse.json({ error: "Sunucu hatasi" }, { status: 500 });
  }
}
