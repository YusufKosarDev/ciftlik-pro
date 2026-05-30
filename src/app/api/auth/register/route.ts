import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

// POST /api/auth/register
// Yeni kullanici kaydi olusturur (sadece ADMIN).
export async function POST(request: Request) {
  try {
    // 0) Sadece ADMIN yeni kullanici olusturabilir
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Bu islem icin yetkiniz yok" },
        { status: 403 }
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

    // 2) E-posta zaten kayitli mi?
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayitli" },
        { status: 409 }
      );
    }

    // 3) Parolayi hash'le (duz metin asla saklanmaz)
    const passwordHash = await bcrypt.hash(password, 10);

    // 4) Kullaniciyi olustur
    const user = await prisma.user.create({
      data: { name, email, password: passwordHash, role },
      // Parolayi asla geri dondurmuyoruz
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Kayit hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
