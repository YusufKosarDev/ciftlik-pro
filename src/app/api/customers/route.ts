import { NextResponse } from "next/server";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { withTenant } from "@/lib/tenant-prisma";
import { customerSchema } from "@/lib/validations/customer";

// POST /api/customers -> yeni musteri olusturur
export async function POST(request: Request) {
  try {
    const authz = await authorizeWrite("customers");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const customer = await withTenant(authz.session.user.tenantId, (db) =>
      db.customer.create({
        data: {
          tenantId: authz.session.user.tenantId,
          name: data.name,
          phone: data.phone || null,
          email: data.email || null,
          notes: data.notes || null,
        },
      })
    );

    await logAudit(authz.session.user, "CREATE", "Customer", customer.id, customer.name);

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Musteri ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
