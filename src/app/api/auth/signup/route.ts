import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { registerSchema } from "@/lib/validations/auth";

// POST /api/auth/signup
// Ziyaretçilerin üye olmasını sağlayan public API ucu.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1) Gelen veriyi doğrula
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    // 2) E-posta zaten kayıtlı mı?
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayıtlı" },
        { status: 409 }
      );
    }

    // 3) Parolayı hash'le
    const passwordHash = await bcrypt.hash(password, 10);

    // 4) Kullanıcıyı oluştur
    const user = await prisma.user.create({
      data: { name, email, password: passwordHash, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // 5) Denetim günlüğü kaydı oluştur (Aktör olarak yeni oluşturulan kullanıcının kendisi)
    await logAudit(
      { id: user.id, name: user.name, email: user.email },
      "CREATE",
      "User",
      user.id,
      `Yeni kayıt oluşturuldu: ${user.email} (${user.role})`
    );

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Kayıt olma hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası, lütfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
