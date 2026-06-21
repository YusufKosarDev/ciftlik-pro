import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canAddRecord } from "@/lib/plan";
import { acceptInviteSchema } from "@/lib/validations/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password-hash";
import { logAudit } from "@/lib/audit";

// POST /api/invitations/[id]/accept -> HERKESE ACIK davet kabulu.
// Davetli adini + parolasini belirler; ilgili tenant'a kullanici olarak eklenir.
// Invitation RLS disidir; token ile (oturum/tenant baglami olmadan) okunur.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(`accept:${clientIp(request)}`, 10, 5 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Cok fazla istek. Lutfen biraz sonra tekrar deneyin." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const { id: token } = await params;
    const body = await request.json();
    const parsed = acceptInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Davet gecersiz veya suresi dolmus" },
        { status: 410 }
      );
    }

    // Plan limiti (davet gonderildikten sonra dolmus olabilir). Hard block.
    const limit = await canAddRecord(invitation.tenantId, "users");
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Çiftlik personel limitine ulaşıldı. Lütfen yöneticiyle iletişime geçin." },
        { status: 403 }
      );
    }

    const { name, password } = parsed.data;
    const passwordHash = await hashPassword(password);

    try {
      await prisma.$transaction(async (tx) => {
        // Tenant baglamini ayarla (User RLS WITH CHECK icin), sonra kullaniciyi yaz.
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${invitation.tenantId}, true)`;
        await tx.user.create({
          data: {
            tenantId: invitation.tenantId,
            name,
            email: invitation.email,
            password: passwordHash,
            role: invitation.role,
            onboardedAt: new Date(), // davetli "mevcut" sayilir; tur gosterilmez
          },
        });
        // Davet tek kullanimlik: kabul edildi olarak isaretle.
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        });
      });
    } catch (err) {
      // E-posta global benzersiz: arada baska yerde kayit olduysa P2002.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json(
          { error: "Bu e-posta adresi zaten kayitli. Lutfen giris yapin." },
          { status: 409 }
        );
      }
      throw err;
    }

    await logAudit(
      { email: invitation.email, tenantId: invitation.tenantId },
      "CREATE",
      "User",
      invitation.email,
      `davet kabul (${invitation.role})`
    );

    return NextResponse.json({ ok: true, email: invitation.email }, { status: 201 });
  } catch (error) {
    console.error("Davet kabul hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
