import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const result = await withTenant(session.user.tenantId, async (db) => {
      const [criticalStock, overdueTasks, upcomingVaccinations] = await Promise.all([
        db.$queryRaw<Array<{ id: string; name: string; quantity: number; criticalLevel: number; unit: string }>>`
          SELECT id, name, quantity, "criticalLevel", "unit"
          FROM "InventoryItem"
          WHERE quantity <= "criticalLevel"
        `,
        db.task.findMany({
          where: {
            status: { not: "DONE" },
            dueDate: { lt: now },
          },
          select: { id: true, title: true, dueDate: true },
          orderBy: { dueDate: "asc" },
          take: 10,
        }),
        db.vaccination.findMany({
          where: {
            nextDate: { gte: now, lte: in30Days },
          },
          select: {
            id: true,
            name: true,
            nextDate: true,
            animal: { select: { id: true, name: true, tagNumber: true } },
          },
          orderBy: { nextDate: "asc" },
          take: 10,
        }),
      ]);

      return {
        criticalStock: criticalStock.map((s) => ({
          id: s.id,
          title: `Kritik Stok: ${s.name}`,
          description: `Kalan: ${s.quantity} ${s.unit} (Kritik: ${s.criticalLevel} ${s.unit})`,
          type: "stock",
          href: "/panel/stok",
        })),
        overdueTasks: overdueTasks.map((t) => ({
          id: t.id,
          title: `Geciken Görev: ${t.title}`,
          description: `Son Tarih: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString("tr-TR") : "-"}`,
          type: "task",
          href: "/panel/gorevler",
        })),
        upcomingVaccinations: upcomingVaccinations.map((v) => ({
          id: v.id,
          title: `Yaklaşan Aşı: ${v.animal.name || v.animal.tagNumber} · ${v.name}`,
          description: `Planlanan Tarih: ${v.nextDate ? new Date(v.nextDate).toLocaleDateString("tr-TR") : "-"}`,
          type: "vaccination",
          href: `/panel/hayvanlar/${v.animal.id}`,
        })),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Bildirim listeleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi" },
      { status: 500 }
    );
  }
}
