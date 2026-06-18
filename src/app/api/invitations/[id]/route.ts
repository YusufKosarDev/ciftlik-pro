import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

// DELETE /api/invitations/[id] -> ADMIN bekleyen bir daveti iptal eder.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("users");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.invitation.findFirst({ where: { id } });
      if (!existing) return null;
      await db.invitation.delete({ where: { id } });
      return existing;
    });

    if (!existing) {
      return NextResponse.json({ error: "Davet bulunamadi" }, { status: 404 });
    }
    await logAudit(authz.session.user, "DELETE", "Invitation", id, existing.email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Davet iptal hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
