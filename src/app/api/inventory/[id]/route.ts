import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inventorySchema } from "@/lib/validations/inventory";

// PUT /api/inventory/[id] -> stok kalemini gunceller
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

    const parsed = inventorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kalem bulunamadi" }, { status: 404 });
    }

    const data = parsed.data;
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        criticalLevel: data.criticalLevel,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Stok guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/[id] -> stok kalemini siler
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
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kalem bulunamadi" }, { status: 404 });
    }

    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stok silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
