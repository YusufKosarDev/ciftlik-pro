import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { transactionSchema } from "@/lib/validations/transaction";

// POST /api/transactions -> yeni gelir/gider kaydi olusturur
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("transactions");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const transaction = await withTenant(authz.session.user.tenantId, (db) =>
      db.transaction.create({
        data: {
          tenantId: authz.session.user.tenantId,
          type: data.type,
          amount: data.amount,
          category: data.category,
          date: new Date(data.date),
          description: data.description || null,
        },
      })
    );

    await logAudit(
      authz.session.user,
      "CREATE",
      "Transaction",
      transaction.id,
      `${transaction.category} (${transaction.amount})`
    );

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Failed to add transaction:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
