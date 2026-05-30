import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { milkYieldSchema } from "@/lib/validations/milk";

// POST /api/animals/[id]/milk -> hayvana sut verimi kaydi ekler
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("milk");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = milkYieldSchema.safeParse(body);
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
    const yield_ = await prisma.milkYield.create({
      data: {
        animalId: id,
        date: new Date(data.date),
        amount: data.amount,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ yield: yield_ }, { status: 201 });
  } catch (error) {
    console.error("Sut verimi ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
