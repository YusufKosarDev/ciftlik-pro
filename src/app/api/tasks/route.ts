import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { taskSchema } from "@/lib/validations/task";

// POST /api/tasks -> yeni gorev olusturur
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("tasks");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const task = await withTenant(authz.session.user.tenantId, (db) =>
      db.task.create({
        data: {
          tenantId: authz.session.user.tenantId,
          title: data.title,
          description: data.description || null,
          assignedToId: data.assignedToId || null,
          status: data.status,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        },
      })
    );

    await logAudit(authz.session.user, "CREATE", "Task", task.id, task.title);

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Failed to add task:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
