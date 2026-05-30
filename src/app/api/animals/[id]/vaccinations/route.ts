import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vaccinationSchema } from "@/lib/validations/vaccination";

// POST /api/animals/[id]/vaccinations -> hayvana asi kaydi ekler
export async function POST(
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

    const parsed = vaccinationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const animal = await prisma.animal.findUnique({ where: { id } });
    if (!animal) {
      return NextResponse.json({ error: "Hayvan bulunamadi" }, { status: 404 });
    }

    const data = parsed.data;
    const vaccination = await prisma.vaccination.create({
      data: {
        animalId: id,
        name: data.name,
        date: new Date(data.date),
        nextDate: data.nextDate ? new Date(data.nextDate) : null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ vaccination }, { status: 201 });
  } catch (error) {
    console.error("Asi kaydi ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
