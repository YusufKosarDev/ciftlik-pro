import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { structureSchema } from "@/lib/validations/structure";

// PUT /api/structures/[id] -> yapiyi gunceller
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("structures");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = structureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.structure.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Yapi bulunamadi" }, { status: 404 });
    }

    const data = parsed.data;
    const structure = await prisma.structure.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ structure });
  } catch (error) {
    console.error("Yapi guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/structures/[id] -> yapiyi siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("structures");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await prisma.structure.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Yapi bulunamadi" }, { status: 404 });
    }

    await prisma.structure.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Yapi silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
