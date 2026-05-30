import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { animalSchema } from "@/lib/validations/animal";

// PUT /api/animals/[id] -> hayvani gunceller
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const parsed = animalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Hayvan var mi?
    const existing = await prisma.animal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Hayvan bulunamadi" }, { status: 404 });
    }

    // Kulak numarasi baska bir hayvanda kullaniliyor mu?
    const tagOwner = await prisma.animal.findUnique({
      where: { tagNumber: data.tagNumber },
    });
    if (tagOwner && tagOwner.id !== id) {
      return NextResponse.json(
        { error: "Bu kulak numarasi baska bir hayvanda kayitli" },
        { status: 409 }
      );
    }

    const animal = await prisma.animal.update({
      where: { id },
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
      },
    });

    return NextResponse.json({ animal });
  } catch (error) {
    console.error("Hayvan guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/animals/[id] -> hayvani siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.animal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Hayvan bulunamadi" }, { status: 404 });
    }

    await prisma.animal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hayvan silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
