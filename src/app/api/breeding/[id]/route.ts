import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

// DELETE /api/breeding/[id] -> ureme kaydini siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
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
      return NextResponse.json({ error: te("recordNotFound") }, { status: 404 });
    }
    await logAudit(authz.session.user, "DELETE", "BreedingRecord", id, existing.sireTag ?? "üreme kaydı");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete breeding record:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
