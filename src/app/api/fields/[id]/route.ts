import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fieldSchema } from "@/lib/validations/field";

// PUT /api/fields/[id] -> tarlayi gunceller
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

    const parsed = fieldSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.field.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tarla bulunamadi" }, { status: 404 });
    }

    const data = parsed.data;
    const field = await prisma.field.update({
      where: { id },
      data: {
        name: data.name,
        area: data.area,
        location: data.location || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ field });
  } catch (error) {
    console.error("Tarla guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/fields/[id] -> tarlayi siler
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
    const existing = await prisma.field.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tarla bulunamadi" }, { status: 404 });
    }

    await prisma.field.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tarla silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
