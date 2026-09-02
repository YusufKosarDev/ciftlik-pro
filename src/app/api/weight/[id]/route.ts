import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

// DELETE /api/weight/[id] -> agirlik kaydini siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
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
      return NextResponse.json({ error: te("recordNotFound") }, { status: 404 });
    }
    await logAudit(authz.session.user, "DELETE", "WeightRecord", id, `${existing.weightKg} kg`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete weight record:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
