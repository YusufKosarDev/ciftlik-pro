import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { structureSchema } from "@/lib/validations/structure";
import { positionSchema } from "@/lib/validations/position";

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

    const data = parsed.data;
    const structure = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.structure.findFirst({ where: { id } });
      if (!existing) return null;
      return db.structure.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type,
          notes: data.notes || null,
        },
      });
    });

    if (!structure) {
      return NextResponse.json({ error: "Yapi bulunamadi" }, { status: 404 });
    }

    await logAudit(authz.session.user, "UPDATE", "Structure", structure.id, structure.name);

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
    const existing = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.structure.findFirst({ where: { id } });
      if (!existing) return null;
      await db.structure.delete({ where: { id } });
      return existing;
    });

    if (!existing) {
      return NextResponse.json({ error: "Yapi bulunamadi" }, { status: 404 });
    }
    await logAudit(authz.session.user, "DELETE", "Structure", id, existing.name);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Yapi silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// PATCH /api/structures/[id] -> sadece harita konumunu (posX/posY) gunceller
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("structures");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = positionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz konum", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const structure = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.structure.findFirst({ where: { id } });
      if (!existing) return null;
      return db.structure.update({
        where: { id },
        data: { posX: parsed.data.posX, posY: parsed.data.posY },
      });
    });

    if (!structure) {
      return NextResponse.json({ error: "Yapi bulunamadi" }, { status: 404 });
    }

    return NextResponse.json({ structure });
  } catch (error) {
    console.error("Yapi konum guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
