import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
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

    const data = parsed.data;

    const result = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.sale.findFirst({ where: { id } });
      if (!existing) return { notFound: true } as const;

      let customerName: string | null = null;
      if (data.customerId) {
        const customer = await db.customer.findFirst({
          where: { id: data.customerId },
          select: { name: true },
        });
        if (!customer) return { error: "Secilen musteri bulunamadi" } as const;
        customerName = customer.name;
      }

      const txData = {
        type: "INCOME" as const,
        amount: data.amount,
        category: "Satış",
        date: new Date(data.date),
        description: saleDescription(data.item, customerName),
      };

      // Bagli gelir islemini guncelle; yoksa yeniden olustur (eski/legacy kayit).
      let transactionId = existing.transactionId;
      if (transactionId) {
        await db.transaction.updateMany({ where: { id: transactionId }, data: txData });
      } else {
        const created = await db.transaction.create({ data: txData });
        transactionId = created.id;
      }
      const sale = await db.sale.update({
        where: { id },
        data: {
          item: data.item,
          customerId: data.customerId || null,
          quantity: data.quantity ?? null,
          unit: data.unit || null,
          amount: data.amount,
          date: new Date(data.date),
          notes: data.notes || null,
          transactionId,
        },
      });
      return { sale };
    });

    if ("notFound" in result) {
      return NextResponse.json({ error: "Satis bulunamadi" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const { sale } = result;

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
    const existing = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.sale.findFirst({ where: { id } });
      if (!existing) return null;
      await db.sale.delete({ where: { id } });
      if (existing.transactionId) {
        // deleteMany: islem zaten silinmisse hata firlatmaz.
        await db.transaction.deleteMany({ where: { id: existing.transactionId } });
      }
      return existing;
    });

    if (!existing) {
      return NextResponse.json({ error: "Satis bulunamadi" }, { status: 404 });
    }
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
