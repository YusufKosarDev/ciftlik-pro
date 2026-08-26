import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { fieldSchema } from "@/lib/validations/field";
import { positionSchema } from "@/lib/validations/position";

// PUT /api/fields/[id] -> tarlayi gunceller
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("fields");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = fieldSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const field = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.field.findFirst({ where: { id } });
      if (!existing) return null;
      return db.field.update({
        where: { id },
        data: {
          name: data.name,
          area: data.area,
          location: data.location || null,
          notes: data.notes || null,
        },
      });
    });

    if (!field) {
      return NextResponse.json({ error: te("fieldNotFound") }, { status: 404 });
    }

    await logAudit(authz.session.user, "UPDATE", "Field", field.id, field.name);

    return NextResponse.json({ field });
  } catch (error) {
    console.error("Tarla guncelleme hatasi:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}

// DELETE /api/fields/[id] -> tarlayi siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("fields");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.field.findFirst({ where: { id } });
      if (!existing) return null;
      await db.field.delete({ where: { id } });
      return existing;
    });

    if (!existing) {
      return NextResponse.json({ error: te("fieldNotFound") }, { status: 404 });
    }
    await logAudit(authz.session.user, "DELETE", "Field", id, existing.name);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tarla silme hatasi:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}

// PATCH /api/fields/[id] -> sadece harita konumunu (posX/posY) gunceller
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("fields");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = positionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidPosition"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const field = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.field.findFirst({ where: { id } });
      if (!existing) return null;
      return db.field.update({
        where: { id },
        data: { posX: parsed.data.posX, posY: parsed.data.posY },
      });
    });

    if (!field) {
      return NextResponse.json({ error: te("fieldNotFound") }, { status: 404 });
    }

    return NextResponse.json({ field });
  } catch (error) {
    console.error("Tarla konum guncelleme hatasi:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
