import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const existing = await prisma.breedingRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kayit bulunamadi" }, { status: 404 });
    }

    await prisma.breedingRecord.delete({ where: { id } });
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
