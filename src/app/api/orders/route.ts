import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/validations/order";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// POST /api/orders -> HERKESE ACIK magaza siparisi (odemesiz). Kimlik gerektirmez;
// bu yuzden hiz siniri + dogrulama + urun aktiflik kontrolu uygulanir. Fiyat/ad
// snapshot olarak saklanir.
export async function POST(request: Request) {
  try {
    // Spam/kotuye kullanima karsi: IP basina 5 dakikada en fazla 10 siparis.
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
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product || !product.active) {
      return NextResponse.json(
        { error: "Urun bulunamadi veya satista degil" },
        { status: 400 }
      );
    }

    const total = product.price * data.quantity;
    const order = await prisma.order.create({
      data: {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: data.quantity,
        total,
        customerName: data.customerName,
        customerPhone: data.customerPhone || null,
        note: data.note || null,
        status: "PENDING",
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
