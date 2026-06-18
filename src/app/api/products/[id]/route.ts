import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { productSchema } from "@/lib/validations/product";

// PUT /api/products/[id] -> urunu gunceller
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("products");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const product = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.product.findFirst({ where: { id } });
      if (!existing) return null;
      return db.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || null,
          price: data.price,
          unit: data.unit || null,
          active: data.active,
        },
      });
    });

    if (!product) {
      return NextResponse.json({ error: "Urun bulunamadi" }, { status: 404 });
    }

    await logAudit(authz.session.user, "UPDATE", "Product", product.id, product.name);

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Urun guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] -> urunu siler. Bagli siparislerin productId'si null
// olur (onDelete: SetNull); siparis snapshot'lari korunur.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("products");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.product.findFirst({ where: { id } });
      if (!existing) return null;
      await db.product.delete({ where: { id } });
      return existing;
    });

    if (!existing) {
      return NextResponse.json({ error: "Urun bulunamadi" }, { status: 404 });
    }
    await logAudit(authz.session.user, "DELETE", "Product", id, existing.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Urun silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
