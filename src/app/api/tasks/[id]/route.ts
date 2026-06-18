import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { taskSchema } from "@/lib/validations/task";

// PUT /api/tasks/[id] -> gorevi gunceller
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("tasks");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const task = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.task.findFirst({ where: { id } });
      if (!existing) return null;
      return db.task.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description || null,
          assignedToId: data.assignedToId || null,
          status: data.status,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        },
      });
    });

    if (!task) {
      return NextResponse.json({ error: "Gorev bulunamadi" }, { status: 404 });
    }

    await logAudit(authz.session.user, "UPDATE", "Task", task.id, task.title);

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Gorev guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] -> gorevi siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("tasks");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.task.findFirst({ where: { id } });
      if (!existing) return null;
      await db.task.delete({ where: { id } });
      return existing;
    });

    if (!existing) {
      return NextResponse.json({ error: "Gorev bulunamadi" }, { status: 404 });
    }
    await logAudit(authz.session.user, "DELETE", "Task", id, existing.title);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gorev silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
