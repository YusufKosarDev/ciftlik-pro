import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/validations/order";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// POST /api/orders -> HERKESE ACIK magaza siparisi (cok kalemli, odemesiz).
// Kimlik gerektirmez; hiz siniri + dogrulama + urun aktiflik kontrolu uygulanir.
// Fiyat/ad her kalem icin snapshot olarak saklanir.
export async function POST(request: Request) {
  try {
    const rl = rateLimit(`order:${clientIp(request)}`, 10, 5 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Cok fazla istek. Lutfen biraz sonra tekrar deneyin." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Sepetteki tum urunleri tek sorguda cek; hepsi mevcut ve aktif olmali.
    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    if (data.items.some((i) => !byId.has(i.productId))) {
      return NextResponse.json(
        { error: "Sepette satista olmayan bir urun var" },
        { status: 400 }
      );
    }

    const itemsData = data.items.map((i) => {
      const p = byId.get(i.productId)!;
      return {
        productId: p.id,
        productName: p.name,
        unitPrice: p.price,
        quantity: i.quantity,
        lineTotal: p.price * i.quantity,
      };
    });
    const total = itemsData.reduce((sum, it) => sum + it.lineTotal, 0);

    const order = await prisma.order.create({
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone || null,
        note: data.note || null,
        total,
        status: "PENDING",
        items: { create: itemsData },
      },
    });

    return NextResponse.json({ ok: true, orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("Siparis olusturma hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
