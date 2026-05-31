import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { weightSchema } from "@/lib/validations/weight";

// POST /api/animals/[id]/weight -> hayvana agirlik kaydi ekler
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("weight");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = weightSchema.safeParse(body);
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
    const record = await prisma.weightRecord.create({
      data: {
        animalId: id,
        date: new Date(data.date),
        weightKg: data.weightKg,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("Agirlik kaydi ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
