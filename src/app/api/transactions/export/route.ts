import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { toCsv } from "@/lib/finance-report";

// GET /api/transactions/export -> downloads every transaction as CSV.
// Finance is sensitive data, so this is limited to ADMIN and ACCOUNTANT (the
// transactions permission).
export async function GET() {
  const authz = await authorizeWrite("transactions");
  if ("error" in authz) return authz.error;

  const transactions = await withTenant(authz.session.user.tenantId, (db) =>
    db.transaction.findMany({
      orderBy: { date: "desc" },
      select: { type: true, amount: true, category: true, date: true, description: true },
    })
  );

  // A UTF-8 BOM, so Excel reads the non-ASCII characters correctly.
  const csv = "﻿" + toCsv(transactions);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="finans.csv"',
    },
  });
}
