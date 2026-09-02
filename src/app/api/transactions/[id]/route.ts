import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { transactionSchema } from "@/lib/validations/transaction";

// PUT /api/transactions/[id] -> islemi gunceller
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("transactions");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const transaction = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.transaction.findFirst({ where: { id } });
      if (!existing) return null;
      return db.transaction.update({
        where: { id },
        data: {
          type: data.type,
          amount: data.amount,
          category: data.category,
          date: new Date(data.date),
          description: data.description || null,
        },
      });
    });

    if (!transaction) {
      return NextResponse.json({ error: te("transactionNotFound") }, { status: 404 });
    }

    await logAudit(
      authz.session.user,
      "UPDATE",
      "Transaction",
      transaction.id,
      `${transaction.category} (${transaction.amount})`
    );

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] -> islemi siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("transactions");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.transaction.findFirst({ where: { id } });
      if (!existing) return null;
      await db.transaction.delete({ where: { id } });
      return existing;
    });

    if (!existing) {
      return NextResponse.json({ error: te("transactionNotFound") }, { status: 404 });
    }
    await logAudit(
      authz.session.user,
      "DELETE",
      "Transaction",
      id,
      `${existing.category} (${existing.amount})`
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
