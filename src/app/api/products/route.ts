import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { productSchema } from "@/lib/validations/product";

// POST /api/products -> yeni urun olusturur (ADMIN/ACCOUNTANT)
export async function POST(request: Request) {
  try {
    const authz = await authorizeWrite("products");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const product = await withTenant(authz.session.user.tenantId, (db) =>
      db.product.create({
        data: {
          tenantId: authz.session.user.tenantId,
          name: data.name,
          description: data.description || null,
          price: data.price,
          unit: data.unit || null,
          active: data.active,
        },
      })
    );

    await logAudit(authz.session.user, "CREATE", "Product", product.id, product.name);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Urun ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
