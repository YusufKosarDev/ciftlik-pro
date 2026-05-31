import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { animalSchema } from "@/lib/validations/animal";

// POST /api/animals -> yeni hayvan olusturur
export async function POST(request: Request) {
  try {
    // 1) Yetki kontrolu: sadece ADMIN/WORKER hayvan ekleyebilir
    const authz = await authorizeWrite("animals");
    if ("error" in authz) return authz.error;

    const body = await request.json();

    // 2) Dogrulama
    const parsed = animalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 3) Kulak numarasi zaten kayitli mi?
    const existing = await prisma.animal.findUnique({
      where: { tagNumber: data.tagNumber },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu kulak numarasi zaten kayitli" },
        { status: 409 }
      );
    }

    // 4) Bos string'leri null'a cevir, tarihi Date'e donustur
    const animal = await prisma.animal.create({
      data: {
        tagNumber: data.tagNumber,
        name: data.name || null,
        species: data.species,
        breed: data.breed || null,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        status: data.status,
        imageUrl: data.imageUrl || null,
        notes: data.notes || null,
        motherId: data.motherId || null,
      },
    });

    return NextResponse.json({ animal }, { status: 201 });
  } catch (error) {
    console.error("Hayvan ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
