import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

// DELETE /api/breeding/[id] -> ureme kaydini siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("breeding");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.breedingRecord.findFirst({ where: { id } });
      if (!existing) return null;
      await db.breedingRecord.delete({ where: { id } });
      return existing;
    });

    if (!existing) {
      return NextResponse.json({ error: "Kayit bulunamadi" }, { status: 404 });
    }
    await logAudit(authz.session.user, "DELETE", "BreedingRecord", id, existing.sireTag ?? "üreme kaydı");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ureme kaydi silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
