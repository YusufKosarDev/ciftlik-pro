import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { DEMO_EMAIL } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { passwordChangeSchema } from "@/lib/validations/password";

// PUT /api/profile/password -> giris yapmis kullanicinin kendi parolasini degistirir.
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    // Demo hesabi salt-okunurdur; parolasini degistiremez. Aksi halde bir demo
    // ziyaretcisi parolayi degistirip diger ziyaretcileri demodan kilitleyebilir.
    if ((session.user.email ?? "").toLowerCase() === DEMO_EMAIL) {
      return NextResponse.json(
        { error: "Demo hesabı salt-okunurdur; parola değiştirilemez." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "Kullanici bulunamadi" }, { status: 404 });
    }

    const { currentPassword, newPassword } = parsed.data;
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Mevcut parola hatali" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    });

    await logAudit(session.user, "UPDATE", "User", user.id, "Parola degistirildi");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Parola degistirme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
