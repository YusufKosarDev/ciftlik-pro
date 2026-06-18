import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signupSchema, slugify } from "@/lib/validations/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password-hash";
import { logAudit } from "@/lib/audit";

// POST /api/auth/signup
// HERKESE ACIK "ciftlik olustur" kaydi: yeni bir Tenant + ilk ADMIN (sahip)
// tek transaction'da olusturur. Kimlik gerektirmez; hiz siniri uygulanir.
//
// RLS uyumu: Tenant tablosu RLS disidir (insert serbest). User insert'i ise
// WITH CHECK politikasina takilir; bu yuzden yeni tenant olusturulduktan SONRA
// ayni transaction'da app.tenant_id ayarlanir, ardindan ADMIN yazilir. Boylece
// uretimde non-superuser rolle de calisir.
export async function POST(request: Request) {
  try {
    // Kotuye kullanim/bot kaydina karsi: IP basina 5 dakikada en fazla 5 kayit.
    const rl = rateLimit(`signup:${clientIp(request)}`, 5, 5 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Cok fazla istek. Lutfen biraz sonra tekrar deneyin." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { farmName, name, email, password } = parsed.data;
    const passwordHash = await hashPassword(password);
    const base = slugify(farmName) || "ciftlik";

    let result: { tenantId: string; userId: string };
    try {
      result = await prisma.$transaction(async (tx) => {
        // Benzersiz slug bul: base, base-2, base-3, ...
        let slug = base;
        for (let n = 2; await tx.tenant.findUnique({ where: { slug } }); n++) {
          slug = `${base}-${n}`;
        }
        const tenant = await tx.tenant.create({ data: { name: farmName, slug } });

        // Yeni tenant baglamini ayarla (RLS WITH CHECK icin), sonra ADMIN'i yaz.
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenant.id}, true)`;
        const user = await tx.user.create({
          // onboardedAt bos: yeni sahip hos geldin turunu gorur.
          data: { tenantId: tenant.id, name, email, password: passwordHash, role: "ADMIN" },
        });
        return { tenantId: tenant.id, userId: user.id };
      });
    } catch (err) {
      // E-posta global benzersizdir: baska bir tenant'ta zaten kayitliysa P2002.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json(
          { error: "Bu e-posta adresi zaten kayitli" },
          { status: 409 }
        );
      }
      throw err;
    }

    await logAudit(
      { id: result.userId, name, email, tenantId: result.tenantId },
      "CREATE",
      "Tenant",
      result.tenantId,
      farmName
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Kayit (signup) hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
