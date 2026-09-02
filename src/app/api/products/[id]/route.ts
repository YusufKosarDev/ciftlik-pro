import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { productSchema } from "@/lib/validations/product";

// PUT /api/products/[id] -> updates a product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("products");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
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
      return NextResponse.json({ error: te("productNotFound") }, { status: 404 });
    }

    await logAudit(authz.session.user, "UPDATE", "Product", product.id, product.name);

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] -> deletes a product. The productId on related orders
// becomes null (onDelete: SetNull); the order snapshots are preserved.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
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
      return NextResponse.json({ error: te("productNotFound") }, { status: 404 });
    }
    await logAudit(authz.session.user, "DELETE", "Product", id, existing.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
