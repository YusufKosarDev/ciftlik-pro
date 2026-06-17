import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { saleSchema } from "@/lib/validations/sale";
import { saleDescription } from "@/app/api/sales/route";

// PUT /api/sales/[id] -> satisi gunceller ve bagli gelir islemini senkronlar.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("sales");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = saleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.sale.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Satis bulunamadi" }, { status: 404 });
    }

    const data = parsed.data;
    const txData = {
      type: "INCOME" as const,
      amount: data.amount,
      category: "Satış",
      date: new Date(data.date),
      description: saleDescription(data.item, data.customer),
    };

    const sale = await prisma.$transaction(async (tx) => {
      // Bagli gelir islemini guncelle; yoksa yeniden olustur (eski/legacy kayit).
      let transactionId = existing.transactionId;
      if (transactionId) {
        await tx.transaction.updateMany({ where: { id: transactionId }, data: txData });
      } else {
        const created = await tx.transaction.create({ data: txData });
        transactionId = created.id;
      }
      return tx.sale.update({
        where: { id },
        data: {
          item: data.item,
          customer: data.customer || null,
          quantity: data.quantity ?? null,
          unit: data.unit || null,
          amount: data.amount,
          date: new Date(data.date),
          notes: data.notes || null,
          transactionId,
        },
      });
    });

    await logAudit(authz.session.user, "UPDATE", "Sale", sale.id, `${sale.item} (${sale.amount})`);

    return NextResponse.json({ sale });
  } catch (error) {
    console.error("Satis guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/[id] -> satisi ve bagli gelir islemini siler.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("sales");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await prisma.sale.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Satis bulunamadi" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.sale.delete({ where: { id } });
      if (existing.transactionId) {
        // deleteMany: islem zaten silinmisse hata firlatmaz.
        await tx.transaction.deleteMany({ where: { id: existing.transactionId } });
      }
    });

    await logAudit(authz.session.user, "DELETE", "Sale", id, `${existing.item} (${existing.amount})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Satis silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
