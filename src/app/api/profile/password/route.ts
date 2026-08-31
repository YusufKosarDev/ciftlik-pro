import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { auth } from "@/lib/auth";
import { isDemoUser } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { passwordChangeSchema } from "@/lib/validations/password";
import { hashPassword, verifyPassword } from "@/lib/password-hash";

// PUT /api/profile/password -> giris yapmis kullanicinin kendi parolasini degistirir.
export async function PUT(request: Request) {
  const te = await getTranslations("Errors");
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
    }

    // Demo hesabi salt-okunurdur; parolasini degistiremez. Aksi halde bir demo
    // ziyaretcisi parolayi degistirip diger ziyaretcileri demodan kilitleyebilir.
    if (isDemoUser(session.user.email)) {
      return NextResponse.json(
        { error: te("demoReadOnlyPassword") },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const tenantId = session.user.tenantId;
    const user = await withTenant(tenantId, (db) =>
      db.user.findFirst({ where: { id: session.user.id } })
    );
    if (!user) {
      return NextResponse.json({ error: te("userNotFound") }, { status: 404 });
    }

    const { currentPassword, newPassword } = parsed.data;
    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: te("currentPasswordWrong") }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await withTenant(tenantId, (db) =>
      db.user.update({
        where: { id: user.id },
        data: { password: passwordHash },
      })
    );

    await logAudit(session.user, "UPDATE", "User", user.id, "Parola degistirildi");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Parola degistirme hatasi:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
