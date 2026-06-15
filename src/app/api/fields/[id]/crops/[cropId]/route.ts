import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { cropSchema } from "@/lib/validations/crop";

// PUT /api/fields/[id]/crops/[cropId] -> ekim kaydini gunceller
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; cropId: string }> }
) {
  try {
    const authz = await authorizeWrite("fields");
    if ("error" in authz) return authz.error;

    const { id, cropId } = await params;
    const body = await request.json();

    const parsed = cropSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Ekim kaydi bu tarlaya mi ait?
    const existing = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!existing) {
      return NextResponse.json({ error: "Ekim kaydi bulunamadi" }, { status: 404 });
    }
    if (existing.fieldId !== id) {
      return NextResponse.json({ error: "Ekim kaydi bu tarlaya ait degil" }, { status: 400 });
    }

    const data = parsed.data;
    const crop = await prisma.crop.update({
      where: { id: cropId },
      data: {
        name: data.name,
        plantedDate: new Date(data.plantedDate),
        harvestDate: data.harvestDate ? new Date(data.harvestDate) : null,
        status: data.status,
        cost: data.cost ?? null,
        revenue: data.revenue ?? null,
        yieldAmount: data.yieldAmount ?? null,
        notes: data.notes || null,
      },
    });

    await logAudit(authz.session.user, "UPDATE", "Crop", crop.id, crop.name);

    return NextResponse.json({ crop });
  } catch (error) {
    console.error("Ekim kaydi guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/fields/[id]/crops/[cropId] -> ekim kaydini siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; cropId: string }> }
) {
  try {
    const authz = await authorizeWrite("fields");
    if ("error" in authz) return authz.error;

    const { id, cropId } = await params;

    const existing = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!existing) {
      return NextResponse.json({ error: "Ekim kaydi bulunamadi" }, { status: 404 });
    }
    if (existing.fieldId !== id) {
      return NextResponse.json({ error: "Ekim kaydi bu tarlaya ait degil" }, { status: 400 });
    }

    await prisma.crop.delete({ where: { id: cropId } });
    await logAudit(authz.session.user, "DELETE", "Crop", cropId, existing.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ekim kaydi silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
