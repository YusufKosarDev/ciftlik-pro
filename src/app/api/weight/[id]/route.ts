import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const existing = await prisma.weightRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kayit bulunamadi" }, { status: 404 });
    }

    await prisma.weightRecord.delete({ where: { id } });
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
