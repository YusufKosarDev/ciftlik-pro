import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { saleSchema } from "@/lib/validations/sale";

// Satistan otomatik gelir islemi icin aciklama.
export function saleDescription(item: string, customer?: string | null): string {
  return customer ? `${item} — ${customer}` : item;
}

// POST /api/sales -> yeni satis olusturur ve ona bagli bir gelir (INCOME)
// islemi yaratir (tek transaction'da). Boylece satislar finansa otomatik yansir.
export async function POST(request: Request) {
  try {
    const authz = await authorizeWrite("sales");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = saleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Musteri (opsiyonel): verildiyse mevcut olmali; adi islem aciklamasinda kullanilir.
    let customerName: string | null = null;
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
        select: { name: true },
      });
      if (!customer) {
        return NextResponse.json({ error: "Secilen musteri bulunamadi" }, { status: 400 });
      }
      customerName = customer.name;
    }

    const sale = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: "INCOME",
          amount: data.amount,
          category: "Satış",
          date: new Date(data.date),
          description: saleDescription(data.item, customerName),
        },
      });
      return tx.sale.create({
        data: {
          item: data.item,
          customerId: data.customerId || null,
          quantity: data.quantity ?? null,
          unit: data.unit || null,
          amount: data.amount,
          date: new Date(data.date),
          notes: data.notes || null,
          transactionId: transaction.id,
        },
      });
    });

    await logAudit(authz.session.user, "CREATE", "Sale", sale.id, `${sale.item} (${sale.amount})`);

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    console.error("Satis ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
