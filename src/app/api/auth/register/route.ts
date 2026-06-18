import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withTenant } from "@/lib/tenant-prisma";
import { canAddRecord } from "@/lib/plan";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { registerSchema } from "@/lib/validations/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password-hash";

// POST /api/auth/register
// Yeni kullanici kaydi olusturur (sadece ADMIN).
export async function POST(request: Request) {
  try {
    // 0) Sadece ADMIN yeni kullanici olusturabilir
    const authz = await authorizeWrite("users");
    if ("error" in authz) return authz.error;

    // Hiz siniri: kazara/kotuye toplu olusturmayi onlemek icin IP basina
    // 5 dakikada en fazla 10 kayit.
    const rl = rateLimit(`register:${clientIp(request)}`, 10, 5 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Cok fazla istek. Lutfen biraz sonra tekrar deneyin." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await request.json();

    // 1) Gelen veriyi dogrula
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;
    const tenantId = authz.session.user.tenantId;

    // Plan limiti (FREE: en fazla 3 personel). Hard block.
    const limit = await canAddRecord(tenantId, "users");
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `FREE planda en fazla ${limit.limit} personel ekleyebilirsiniz. Daha fazlası için PRO'ya yükseltin.`,
          code: "PLAN_LIMIT",
        },
        { status: 403 }
      );
    }

    // 2) E-posta zaten kayitli mi? (aktif tenant icinde)
    const existing = await withTenant(tenantId, (db) =>
      db.user.findFirst({ where: { email } })
    );
    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayitli" },
        { status: 409 }
      );
    }

    // 3) Parolayi hash'le (duz metin asla saklanmaz)
    const passwordHash = await hashPassword(password);

    // 4) Kullaniciyi olustur. Yeni kullanici, kaydi olusturan ADMIN'in tenant'ina
    // baglanir (tenantId acikca verilir; withTenant RLS baglamini ayarlar).
    let user;
    try {
      user = await withTenant(tenantId, (db) =>
        db.user.create({
          data: { tenantId, name, email, password: passwordHash, role },
          // Parolayi asla geri dondurmuyoruz
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        })
      );
    } catch (err) {
      // E-posta global benzersiz: baska bir tenant'ta zaten kayitliysa P2002.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json(
          { error: "Bu e-posta adresi zaten kayitli" },
          { status: 409 }
        );
      }
      throw err;
    }

    await logAudit(authz.session.user, "CREATE", "User", user.id, user.email);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Kayit hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
