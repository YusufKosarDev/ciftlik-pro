import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { customerSchema } from "@/lib/validations/customer";

// PUT /api/customers/[id] -> musteriyi gunceller
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("customers");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Musteri bulunamadi" }, { status: 404 });
    }

    const data = parsed.data;
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      },
    });

    await logAudit(authz.session.user, "UPDATE", "Customer", customer.id, customer.name);

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Musteri guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] -> musteriyi siler. Bagli satislarin customerId'si
// null olur (onDelete: SetNull); satis kayitlari silinmez.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("customers");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Musteri bulunamadi" }, { status: 404 });
    }

    await prisma.customer.delete({ where: { id } });
    await logAudit(authz.session.user, "DELETE", "Customer", id, existing.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Musteri silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
