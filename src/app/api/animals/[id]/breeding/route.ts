import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { breedingSchema } from "@/lib/validations/breeding";

// POST /api/animals/[id]/breeding -> hayvana ureme kaydi ekler
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("breeding");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = breedingSchema.safeParse(body);
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
    const record = await prisma.breedingRecord.create({
      data: {
        animalId: id,
        sireTag: data.sireTag || null,
        breedingDate: new Date(data.breedingDate),
        expectedBirthDate: data.expectedBirthDate
          ? new Date(data.expectedBirthDate)
          : null,
        actualBirthDate: data.actualBirthDate
          ? new Date(data.actualBirthDate)
          : null,
        status: data.status,
        offspringCount: data.offspringCount ?? null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("Ureme kaydi ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
