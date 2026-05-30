import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { vaccinationSchema } from "@/lib/validations/vaccination";

// POST /api/animals/[id]/vaccinations -> hayvana asi kaydi ekler
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("animalMedical");
    if ("error" in authz) return authz.error;

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
