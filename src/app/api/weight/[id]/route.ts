import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

// DELETE /api/weight/[id] -> agirlik kaydini siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("weight");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.weightRecord.findFirst({ where: { id } });
      if (!existing) return null;
      await db.weightRecord.delete({ where: { id } });
      return existing;
    });

    if (!existing) {
      return NextResponse.json({ error: "Kayit bulunamadi" }, { status: 404 });
    }
    await logAudit(authz.session.user, "DELETE", "WeightRecord", id, `${existing.weightKg} kg`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Agirlik kaydi silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
