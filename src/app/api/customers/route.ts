import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
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
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      },
    });

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
