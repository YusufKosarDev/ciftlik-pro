import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { fieldSchema } from "@/lib/validations/field";

// POST /api/fields -> yeni tarla olusturur
export async function POST(request: Request) {
  try {
    const authz = await authorizeWrite("fields");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = fieldSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const field = await withTenant(authz.session.user.tenantId, (db) =>
      db.field.create({
        data: {
          name: data.name,
          area: data.area,
          location: data.location || null,
          notes: data.notes || null,
        },
      })
    );

    await logAudit(authz.session.user, "CREATE", "Field", field.id, field.name);

    return NextResponse.json({ field }, { status: 201 });
  } catch (error) {
    console.error("Tarla ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
