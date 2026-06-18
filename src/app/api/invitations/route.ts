import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { canAddRecord } from "@/lib/plan";
import { logAudit } from "@/lib/audit";
import { inviteSchema } from "@/lib/validations/auth";
import { sendEmail } from "@/lib/email";

const INVITE_TTL_DAYS = 7;

// POST /api/invitations -> ADMIN tenant-ici personel daveti olusturur.
// Davetli, donen token baglantisiyla (/davet/<token>) adini/parolasini belirler.
export async function POST(request: Request) {
  try {
    const authz = await authorizeWrite("users");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;
    const tenantId = authz.session.user.tenantId;

    // Plan limiti (FREE: en fazla 3 personel). Limit doluysa davet de gonderilmez.
    const limit = await canAddRecord(tenantId, "users");
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `FREE planda en fazla ${limit.limit} personel olabilir. Davet için PRO'ya yükseltin.`,
          code: "PLAN_LIMIT",
        },
        { status: 403 }
      );
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const result = await withTenant(tenantId, async (db) => {
      // Zaten bu tenant'in uyesi mi?
      const existingUser = await db.user.findFirst({ where: { email } });
      if (existingUser) return { conflict: true } as const;

      // Ayni e-posta icin bekleyen davet varsa yenisiyle degistir (tekrar davet).
      await db.invitation.deleteMany({ where: { email, acceptedAt: null } });
      const invitation = await db.invitation.create({
        data: { tenantId, email, role, token, invitedById: authz.session.user.id, expiresAt },
      });
      return { invitation } as const;
    });

    if ("conflict" in result) {
      return NextResponse.json(
        { error: "Bu e-posta zaten ekibinizde kayitli" },
        { status: 409 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const acceptUrl = `${origin}/davet/${token}`;

    // E-posta yapilandirildiysa daveti gonder (best-effort; yoksa link UI'da gosterilir).
    await sendEmail(
      [email],
      "Çiftlik Pro — ekibe davet edildiniz",
      `<p>Bir çiftlik ekibine davet edildiniz. Katılmak için:</p>
       <p><a href="${acceptUrl}">${acceptUrl}</a></p>
       <p>Bu bağlantı ${INVITE_TTL_DAYS} gün geçerlidir.</p>`
    );

    await logAudit(authz.session.user, "CREATE", "Invitation", result.invitation.id, email);

    return NextResponse.json({ ok: true, acceptUrl, expiresAt }, { status: 201 });
  } catch (error) {
    console.error("Davet olusturma hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
