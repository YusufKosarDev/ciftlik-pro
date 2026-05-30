import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { transactionSchema } from "@/lib/validations/transaction";

// PUT /api/transactions/[id] -> islemi gunceller
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("transactions");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Islem bulunamadi" }, { status: 404 });
    }

    const data = parsed.data;
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        type: data.type,
        amount: data.amount,
        category: data.category,
        date: new Date(data.date),
        description: data.description || null,
      },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Islem guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] -> islemi siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("transactions");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Islem bulunamadi" }, { status: 404 });
    }

    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Islem silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
