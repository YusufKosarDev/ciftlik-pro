import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { cropSchema } from "@/lib/validations/crop";

// POST /api/fields/[id]/crops -> tarlaya ekim kaydi ekler
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("fields");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = cropSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const crop = await withTenant(authz.session.user.tenantId, async (db) => {
      const field = await db.field.findFirst({ where: { id } });
      if (!field) return null;
      return db.crop.create({
        data: {
          fieldId: id,
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
    });

    if (!crop) {
      return NextResponse.json({ error: "Tarla bulunamadi" }, { status: 404 });
    }

    await logAudit(authz.session.user, "CREATE", "Crop", crop.id, crop.name);

    return NextResponse.json({ crop }, { status: 201 });
  } catch (error) {
    console.error("Ekim kaydi ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
